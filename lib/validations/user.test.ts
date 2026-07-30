import { describe, expect, it } from "vitest";
import { createUserSchema, updateUserSchema } from "./user";

describe("createUserSchema", () => {
  it("requires a phone number when role is driver", () => {
    const result = createUserSchema.safeParse({
      fullName: "Sipho Driver",
      email: "sipho@example.com",
      role: "driver",
      phone: "",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((issue) => issue.path.includes("phone"))).toBe(true);
    }
  });

  it("does not require a phone number for admin accounts", () => {
    const result = createUserSchema.safeParse({
      fullName: "Ops Admin",
      email: "admin@example.com",
      role: "admin",
    });

    expect(result.success).toBe(true);
  });

  it("accepts a driver with a phone number", () => {
    const result = createUserSchema.safeParse({
      fullName: "Sipho Driver",
      email: "sipho@example.com",
      role: "driver",
      phone: "+27821234567",
    });

    expect(result.success).toBe(true);
  });

  it("rejects an invalid email", () => {
    const result = createUserSchema.safeParse({
      fullName: "Ops Admin",
      email: "not-an-email",
      role: "admin",
    });

    expect(result.success).toBe(false);
  });
});

describe("updateUserSchema", () => {
  it("requires a valid uuid id", () => {
    const result = updateUserSchema.safeParse({
      id: "not-a-uuid",
      fullName: "Ops Admin",
      role: "admin",
      active: true,
    });

    expect(result.success).toBe(false);
  });

  it("accepts a well-formed update", () => {
    const result = updateUserSchema.safeParse({
      id: "123e4567-e89b-12d3-a456-426614174000",
      fullName: "Ops Admin",
      role: "admin",
      active: false,
    });

    expect(result.success).toBe(true);
  });
});
