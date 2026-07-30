"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { updateOwnProfile } from "@/lib/actions/driver-profile";
import { updateProfileSchema, type UpdateProfileInput } from "@/lib/validations/driver-profile";

export function ProfileForm({
  fullName,
  email,
  phone,
  driversLicense,
  pdpNumber,
}: {
  fullName: string;
  email: string;
  phone: string | null;
  driversLicense: string | null;
  pdpNumber: string | null;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<UpdateProfileInput>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: { phone: phone ?? "" },
  });

  async function onSubmit(values: UpdateProfileInput) {
    setIsSubmitting(true);
    const result = await updateOwnProfile(values);
    setIsSubmitting(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success("Profile updated");
  }

  return (
    <div className="max-w-md space-y-6">
      <div className="space-y-3 rounded-xl bg-card p-5 ring-1 ring-ink/8 shadow-sm shadow-ink/[0.03] sm:p-6">
        <div>
          <p className="text-label text-mist">Name</p>
          <p className="text-slate">{fullName}</p>
        </div>
        <div>
          <p className="text-label text-mist">Email</p>
          <p className="text-slate">{email}</p>
        </div>
        <div>
          <p className="text-label text-mist">Driver&apos;s license</p>
          <p className="font-mono text-slate">{driversLicense || "—"}</p>
        </div>
        <div>
          <p className="text-label text-mist">PDP number</p>
          <p className="font-mono text-slate">{pdpNumber || "—"}</p>
        </div>
        <p className="text-xs text-mist">
          To change your name, license, or PDP details, contact your Super Admin.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone</FormLabel>
                <FormControl>
                  <Input type="tel" autoComplete="tel" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="size-4 animate-spin" />}
            Save
          </Button>
        </form>
      </Form>
    </div>
  );
}
