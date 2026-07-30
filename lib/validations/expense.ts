import { z } from "zod";

export const expenseTypeSchema = z.enum(["tfn", "diesel", "overnight", "truck_wash", "oil"]);

export const createExpenseSchema = z.object({
  type: expenseTypeSchema,
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  expenseDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Enter a valid date"),
  notes: z.string().max(1000).optional().or(z.literal("")),
  orderId: z.string().uuid().optional().or(z.literal("")),
});
export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;

export const reviewExpenseSchema = z
  .object({
    expenseId: z.string().uuid(),
    decision: z.enum(["approved", "rejected"]),
    rejectionReason: z.string().max(500).optional().or(z.literal("")),
  })
  .superRefine((data, ctx) => {
    if (data.decision === "rejected" && !data.rejectionReason) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "A reason is required when rejecting an expense",
        path: ["rejectionReason"],
      });
    }
  });
export type ReviewExpenseInput = z.infer<typeof reviewExpenseSchema>;
