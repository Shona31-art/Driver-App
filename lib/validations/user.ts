import { z } from "zod";

export const userRoleSchema = z.enum(["super_admin", "admin", "driver"]);

// Driver-only fields are required only when role === "driver" -- enforced
// via superRefine rather than making them globally required, since
// Super Admin/Admin accounts have no drivers row at all.
export const createUserSchema = z
  .object({
    fullName: z.string().min(1, "Full name is required").max(120),
    email: z.string().min(1, "Email is required").email("Enter a valid email address"),
    role: userRoleSchema,
    phone: z.string().max(30).optional().or(z.literal("")),
    driversLicense: z.string().max(50).optional().or(z.literal("")),
    pdpNumber: z.string().max(50).optional().or(z.literal("")),
    horseRegistration: z.string().max(30).optional().or(z.literal("")),
  })
  .superRefine((data, ctx) => {
    if (data.role === "driver" && !data.phone) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Phone number is required for drivers",
        path: ["phone"],
      });
    }
  });
export type CreateUserInput = z.infer<typeof createUserSchema>;

export const updateUserSchema = z.object({
  id: z.string().uuid(),
  fullName: z.string().min(1, "Full name is required").max(120),
  role: userRoleSchema,
  active: z.boolean(),
  phone: z.string().max(30).optional().or(z.literal("")),
  driversLicense: z.string().max(50).optional().or(z.literal("")),
  pdpNumber: z.string().max(50).optional().or(z.literal("")),
  horseRegistration: z.string().max(30).optional().or(z.literal("")),
});
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
