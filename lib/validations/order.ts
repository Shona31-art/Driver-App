import { z } from "zod";

const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Enter a valid date");

export const orderFormSchema = z
  .object({
    customerName: z.string().min(1, "Customer name is required").max(200),
    pickupAddress: z.string().min(1, "Pickup address is required").max(500),
    deliveryAddress: z.string().min(1, "Delivery address is required").max(500),
    pickupDate: dateString,
    deliveryDate: dateString,
    // Plain z.number() (not z.coerce) so the RHF resolver's input/output
    // types match exactly -- the form component converts the <input
    // type="number"> string to a real number in its onChange handler
    // before it ever reaches Zod, same fix as loginSchema.rememberMe.
    weightTons: z.number().positive("Weight must be greater than 0"),
    truckId: z.string().uuid("Select a truck"),
    loadingNumber: z.string().max(50).optional().or(z.literal("")),
    notes: z.string().max(2000).optional().or(z.literal("")),
    driverId: z.string().uuid().optional().or(z.literal("")),
  })
  .refine((data) => data.deliveryDate >= data.pickupDate, {
    message: "Delivery date cannot be before pickup date",
    path: ["deliveryDate"],
  });
export type OrderFormInput = z.infer<typeof orderFormSchema>;

export const createOrderSchema = orderFormSchema;
export type CreateOrderInput = z.infer<typeof createOrderSchema>;

export const updateOrderSchema = z.object({
  id: z.string().uuid(),
  customerName: z.string().min(1, "Customer name is required").max(200),
  pickupAddress: z.string().min(1, "Pickup address is required").max(500),
  deliveryAddress: z.string().min(1, "Delivery address is required").max(500),
  pickupDate: dateString,
  deliveryDate: dateString,
  weightTons: z.number().positive("Weight must be greater than 0"),
  truckId: z.string().uuid("Select a truck"),
  loadingNumber: z.string().max(50).optional().or(z.literal("")),
  notes: z.string().max(2000).optional().or(z.literal("")),
});
export type UpdateOrderInput = z.infer<typeof updateOrderSchema>;

export const assignDriverSchema = z.object({
  orderId: z.string().uuid(),
  driverId: z.string().uuid(),
});
export type AssignDriverInput = z.infer<typeof assignDriverSchema>;

export const markLoadedSchema = z.object({
  orderId: z.string().uuid(),
  beginKm: z.coerce.number().nonnegative("Begin KM must be 0 or greater"),
});
export type MarkLoadedInput = z.infer<typeof markLoadedSchema>;

export const markDeliveredSchema = z.object({
  orderId: z.string().uuid(),
  endKm: z.coerce.number().nonnegative("End KM must be 0 or greater"),
  confirmedPin: z.string().min(1, "Enter the offload PIN given to you by the recipient"),
  notes: z.string().max(2000).optional().or(z.literal("")),
});
export type MarkDeliveredInput = z.infer<typeof markDeliveredSchema>;
