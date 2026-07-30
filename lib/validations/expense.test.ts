import { describe, expect, it } from "vitest";
import { createExpenseSchema, reviewExpenseSchema } from "./expense";

describe("createExpenseSchema", () => {
  it("accepts a well-formed expense", () => {
    const result = createExpenseSchema.safeParse({
      type: "diesel",
      amount: 850,
      expenseDate: "2026-07-30",
    });
    expect(result.success).toBe(true);
  });

  it("rejects a non-positive amount", () => {
    const result = createExpenseSchema.safeParse({ type: "diesel", amount: 0, expenseDate: "2026-07-30" });
    expect(result.success).toBe(false);
  });

  it("rejects an unknown expense type", () => {
    const result = createExpenseSchema.safeParse({ type: "toll", amount: 50, expenseDate: "2026-07-30" });
    expect(result.success).toBe(false);
  });
});

describe("reviewExpenseSchema", () => {
  it("requires a rejection reason when rejecting", () => {
    const result = reviewExpenseSchema.safeParse({
      expenseId: "123e4567-e89b-12d3-a456-426614174000",
      decision: "rejected",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((issue) => issue.path.includes("rejectionReason"))).toBe(true);
    }
  });

  it("does not require a reason when approving", () => {
    const result = reviewExpenseSchema.safeParse({
      expenseId: "123e4567-e89b-12d3-a456-426614174000",
      decision: "approved",
    });
    expect(result.success).toBe(true);
  });

  it("accepts a rejection with a reason", () => {
    const result = reviewExpenseSchema.safeParse({
      expenseId: "123e4567-e89b-12d3-a456-426614174000",
      decision: "rejected",
      rejectionReason: "Missing receipt",
    });
    expect(result.success).toBe(true);
  });
});
