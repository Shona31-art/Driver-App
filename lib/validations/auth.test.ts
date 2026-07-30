import { describe, expect, it } from "vitest";
import { forgotPasswordSchema, loginSchema, resetPasswordSchema } from "./auth";

describe("loginSchema", () => {
  it("rejects a missing password", () => {
    const result = loginSchema.safeParse({ email: "user@example.com", password: "" });
    expect(result.success).toBe(false);
  });

  it("accepts a well-formed login with rememberMe set", () => {
    const result = loginSchema.safeParse({ email: "user@example.com", password: "secret123", rememberMe: false });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.rememberMe).toBe(false);
    }
  });
});

describe("forgotPasswordSchema", () => {
  it("rejects an invalid email", () => {
    const result = forgotPasswordSchema.safeParse({ email: "nope" });
    expect(result.success).toBe(false);
  });
});

describe("resetPasswordSchema", () => {
  it("rejects mismatched passwords", () => {
    const result = resetPasswordSchema.safeParse({ password: "password123", confirmPassword: "password124" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((issue) => issue.path.includes("confirmPassword"))).toBe(true);
    }
  });

  it("rejects a password shorter than 8 characters", () => {
    const result = resetPasswordSchema.safeParse({ password: "short", confirmPassword: "short" });
    expect(result.success).toBe(false);
  });

  it("accepts matching, long-enough passwords", () => {
    const result = resetPasswordSchema.safeParse({ password: "password123", confirmPassword: "password123" });
    expect(result.success).toBe(true);
  });
});
