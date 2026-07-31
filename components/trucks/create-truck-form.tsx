"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { createTruckSchema, type CreateTruckInput } from "@/lib/validations/truck";

export function CreateTruckForm({
  onSubmit,
  isSubmitting,
}: {
  onSubmit: (values: CreateTruckInput) => void;
  isSubmitting: boolean;
}) {
  const form = useForm<CreateTruckInput>({
    resolver: zodResolver(createTruckSchema),
    defaultValues: { registration: "", makeModel: "", maxCapacityTons: undefined },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <FormField
          control={form.control}
          name="registration"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Horse</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="makeModel"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Make / model (optional)</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="maxCapacityTons"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Weight (max capacity, tons) (optional)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.1"
                  min="0"
                  value={field.value ?? ""}
                  onChange={(e) => field.onChange(e.target.value === "" ? undefined : e.target.valueAsNumber)}
                  onBlur={field.onBlur}
                  name={field.name}
                  ref={field.ref}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="size-4 animate-spin" />}
          Add truck
        </Button>
      </form>
    </Form>
  );
}
