import { z } from "zod";

export const createTruckSchema = z.object({
  registration: z.string().min(1, "Horse registration is required").max(30),
  makeModel: z.string().max(100).optional().or(z.literal("")),
  maxCapacityTons: z.number().positive("Weight must be greater than 0").optional(),
});
export type CreateTruckInput = z.infer<typeof createTruckSchema>;

export const updateTruckSchema = z.object({
  id: z.string().uuid(),
  registration: z.string().min(1, "Horse registration is required").max(30),
  makeModel: z.string().max(100).optional().or(z.literal("")),
  maxCapacityTons: z.number().positive("Weight must be greater than 0").optional(),
  active: z.boolean(),
});
export type UpdateTruckInput = z.infer<typeof updateTruckSchema>;
