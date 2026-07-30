"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { createNotification } from "@/lib/actions/notifications";
import { recordExpenseDocument } from "@/lib/actions/documents";
import { createExpenseSchema, reviewExpenseSchema } from "@/lib/validations/expense";
import { uploadedFileMetaSchema } from "@/lib/validations/document";
import type { ActionResult } from "@/lib/actions/types";

const GENERIC_ERROR = "Something went wrong. Please try again.";

async function getOwnDriverId(userId: string): Promise<string | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("drivers").select("id").eq("user_id", userId).single();
  return data?.id ?? null;
}

type CreateExpenseDraftResult = { success: true; expenseId: string } | { success: false; error: string };

// orderId is optional -- a driver can log an expense against a specific
// trip (selected by order number in the form) or leave it unlinked.
//
// Split into two steps (this, then attachExpenseReceipt) because the
// receipt has to be uploaded directly to Storage from the client to avoid
// the Server Action body limit, and Storage's RLS folder-scoping requires
// the expense row to already exist before anything can be uploaded under
// expenses/{expenseId}/. If the client fails to attach a receipt after
// this succeeds, the expense is left in place without one -- an admin
// reviewing expenses will see it has no receipt and can reject it; this
// mirrors the same "storage succeeds, DB write fails" partial-failure risk
// that already existed here before the split.
export async function createExpenseDraft(input: {
  type: string;
  amount: number;
  expenseDate: string;
  notes?: string;
  orderId?: string;
}): Promise<CreateExpenseDraftResult> {
  const actor = await requireRole("driver");
  const driverId = await getOwnDriverId(actor.id);
  if (!driverId) return { success: false, error: GENERIC_ERROR };

  const parsed = createExpenseSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  const data = parsed.data;

  const supabase = await createClient();

  if (data.orderId) {
    const { data: owned } = await supabase
      .from("orders")
      .select("id")
      .eq("id", data.orderId)
      .eq("driver_id", driverId)
      .maybeSingle();
    if (!owned) return { success: false, error: "This order wasn't found, or isn't yours." };
  }

  const { data: expense, error } = await supabase
    .from("expenses")
    .insert({
      driver_id: driverId,
      order_id: data.orderId || null,
      type: data.type,
      amount: data.amount,
      expense_date: data.expenseDate,
      notes: data.notes || null,
    })
    .select("id")
    .single();

  if (error || !expense) {
    console.error("createExpenseDraft failed", error);
    return { success: false, error: GENERIC_ERROR };
  }

  return { success: true, expenseId: expense.id };
}

const attachExpenseReceiptSchema = z.object({
  expenseId: z.string().uuid(),
  receipt: uploadedFileMetaSchema,
});

export async function attachExpenseReceipt(input: z.infer<typeof attachExpenseReceiptSchema>): Promise<ActionResult> {
  const actor = await requireRole("driver");
  const driverId = await getOwnDriverId(actor.id);
  if (!driverId) return { success: false, error: GENERIC_ERROR };

  const parsed = attachExpenseReceiptSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const supabase = await createClient();

  const { data: owned } = await supabase
    .from("expenses")
    .select("id")
    .eq("id", parsed.data.expenseId)
    .eq("driver_id", driverId)
    .maybeSingle();
  if (!owned) return { success: false, error: "This expense wasn't found, or isn't yours." };

  const result = await recordExpenseDocument(supabase, {
    expenseId: parsed.data.expenseId,
    meta: parsed.data.receipt,
    uploadedBy: actor.id,
  });
  if (!result.success) return result;

  revalidatePath("/driver/expenses");
  revalidatePath("/driver/dashboard");
  return { success: true };
}

export async function reviewExpense(input: {
  expenseId: string;
  decision: "approved" | "rejected";
  rejectionReason?: string;
}): Promise<ActionResult> {
  const actor = await requireRole("super_admin", "admin");

  const parsed = reviewExpenseSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  const data = parsed.data;

  const supabase = await createClient();

  const { data: expense, error } = await supabase
    .from("expenses")
    .update({
      status: data.decision,
      reviewed_by: actor.id,
      reviewed_at: new Date().toISOString(),
      rejection_reason: data.decision === "rejected" ? data.rejectionReason || null : null,
    })
    .eq("id", data.expenseId)
    .select("driver_id, type, amount")
    .single();

  if (error || !expense) {
    console.error("reviewExpense failed", error);
    return { success: false, error: GENERIC_ERROR };
  }

  const { data: driver } = await supabase.from("drivers").select("user_id").eq("id", expense.driver_id).single();

  if (driver) {
    await createNotification({
      userId: driver.user_id,
      type: data.decision === "approved" ? "expense_approved" : "expense_rejected",
      title: data.decision === "approved" ? "Expense approved" : "Expense rejected",
      message:
        data.decision === "approved"
          ? `Your ${expense.type} expense of R${expense.amount} was approved.`
          : `Your ${expense.type} expense of R${expense.amount} was rejected${data.rejectionReason ? `: ${data.rejectionReason}` : "."}`,
      relatedExpenseId: data.expenseId,
    });
  }

  revalidatePath("/admin/expenses");
  revalidatePath("/driver/expenses");
  return { success: true };
}
