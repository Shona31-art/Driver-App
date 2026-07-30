import { z } from "zod";

export const updateProfileSchema = z.object({
  phone: z.string().min(1, "Phone number is required").max(30),
});
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
