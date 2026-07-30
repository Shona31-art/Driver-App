import { describe, expect, it } from "vitest";
import { createOrderSchema, updateOrderSchema } from "./order";

const baseOrder = {
  customerName: "Acme Logistics",
  pickupAddress: "12 Main Rd, Cape Town",
  deliveryAddress: "45 Oak Ave, Johannesburg",
  pickupDate: "2026-08-01",
  deliveryDate: "2026-08-03",
  weightTons: 24.5,
  horseRegistration: "CA 123-456",
};

describe("createOrderSchema", () => {
  it("accepts a well-formed order", () => {
    const result = createOrderSchema.safeParse(baseOrder);
    expect(result.success).toBe(true);
  });

  it("rejects a delivery date before the pickup date", () => {
    const result = createOrderSchema.safeParse({ ...baseOrder, deliveryDate: "2026-07-31" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((issue) => issue.path.includes("deliveryDate"))).toBe(true);
    }
  });

  it("accepts a delivery date equal to the pickup date", () => {
    const result = createOrderSchema.safeParse({ ...baseOrder, deliveryDate: baseOrder.pickupDate });
    expect(result.success).toBe(true);
  });

  it("rejects a non-positive weight", () => {
    const result = createOrderSchema.safeParse({ ...baseOrder, weightTons: 0 });
    expect(result.success).toBe(false);
  });
});

describe("updateOrderSchema", () => {
  it("requires a valid uuid id", () => {
    const result = updateOrderSchema.safeParse({ ...baseOrder, id: "not-a-uuid" });
    expect(result.success).toBe(false);
  });

  it("accepts a well-formed update", () => {
    const result = updateOrderSchema.safeParse({ ...baseOrder, id: "123e4567-e89b-12d3-a456-426614174000" });
    expect(result.success).toBe(true);
  });
});
