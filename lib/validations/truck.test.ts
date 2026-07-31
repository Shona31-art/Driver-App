import { describe, expect, it } from "vitest";
import { createTruckSchema, updateTruckSchema } from "./truck";

describe("createTruckSchema", () => {
  it("requires a registration", () => {
    const result = createTruckSchema.safeParse({ registration: "" });
    expect(result.success).toBe(false);
  });

  it("accepts a registration with no make/model", () => {
    const result = createTruckSchema.safeParse({ registration: "DGJ997NC" });
    expect(result.success).toBe(true);
  });

  it("accepts a registration with a make/model", () => {
    const result = createTruckSchema.safeParse({ registration: "DGJ997NC", makeModel: "Volvo FH16" });
    expect(result.success).toBe(true);
  });

  it("accepts a registration with no max capacity", () => {
    const result = createTruckSchema.safeParse({ registration: "DGJ997NC" });
    expect(result.success).toBe(true);
  });

  it("rejects a zero or negative max capacity", () => {
    const result = createTruckSchema.safeParse({ registration: "DGJ997NC", maxCapacityTons: 0 });
    expect(result.success).toBe(false);
  });

  it("accepts a positive max capacity", () => {
    const result = createTruckSchema.safeParse({ registration: "DGJ997NC", maxCapacityTons: 34 });
    expect(result.success).toBe(true);
  });
});

describe("updateTruckSchema", () => {
  it("requires a valid uuid id", () => {
    const result = updateTruckSchema.safeParse({
      id: "not-a-uuid",
      registration: "DGJ997NC",
      active: true,
    });
    expect(result.success).toBe(false);
  });

  it("accepts a well-formed update", () => {
    const result = updateTruckSchema.safeParse({
      id: "123e4567-e89b-12d3-a456-426614174000",
      registration: "DGJ997NC",
      active: false,
    });
    expect(result.success).toBe(true);
  });
});
