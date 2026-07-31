"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import { resetPasswordSchema, type ResetPasswordInput } from "@/lib/validations/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

type SessionState = "checking" | "ready" | "invalid";

// Reached via the link in Supabase's invite/password-reset email. Those
// links are always admin-initiated (an admin invites someone, or resets a
// password on someone else's behalf) -- there's no browser session shared
// between the admin's request and the recipient's eventual click, so
// there's nowhere to attach a PKCE code verifier. Supabase falls back to
// putting the session tokens directly in the URL fragment
// (#access_token=...) instead of a ?code= query param in that case.
// Fragments never reach the server, so a server Route Handler can't see
// them -- establishing the session has to happen here, client-side. This
// also transparently handles the ?code= case (e.g. a same-device
// self-service "forgot password" request), so one component covers both.
export function ResetPasswordForm() {
  const [sessionState, setSessionState] = useState<SessionState>("checking");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const form = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  useEffect(() => {
    async function establishSession() {
      const supabase = createClient();
      const hashParams = new URLSearchParams(window.location.hash.slice(1));
      const accessToken = hashParams.get("access_token");
      const refreshToken = hashParams.get("refresh_token");

      if (hashParams.get("error_description")) {
        setSessionState("invalid");
        return;
      }

      if (accessToken && refreshToken) {
        const { error } = await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
        window.history.replaceState(null, "", window.location.pathname);
        setSessionState(error ? "invalid" : "ready");
        return;
      }

      const code = new URLSearchParams(window.location.search).get("code");
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        window.history.replaceState(null, "", window.location.pathname);
        setSessionState(error ? "invalid" : "ready");
        return;
      }

      // No token in the URL -- might already have a valid session from a
      // page refresh after a previous successful attempt.
      const { data } = await supabase.auth.getUser();
      setSessionState(data.user ? "ready" : "invalid");
    }

    establishSession();
  }, []);

  async function onSubmit(values: ResetPasswordInput) {
    setFormError(null);
    setIsSubmitting(true);

    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: values.password });

    if (error) {
      setIsSubmitting(false);
      setFormError("Couldn't update your password. The reset link may have expired -- request a new one.");
      return;
    }

    window.location.assign("/");
  }

  if (sessionState === "checking") {
    return <p className="text-center text-sm text-slate">Verifying your link...</p>;
  }

  if (sessionState === "invalid") {
    return (
      <div className="space-y-3 text-center">
        <p className="text-sm text-danger">That link has expired or already been used.</p>
        <a href="/forgot-password" className="text-sm text-brand hover:underline">
          Request a new link
        </a>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {formError && (
          <div role="alert" className="rounded-md border border-danger/30 bg-danger-tint px-3 py-2 text-sm text-danger">
            {formError}
          </div>
        )}

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>New password</FormLabel>
              <FormControl>
                <Input type="password" autoComplete="new-password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Confirm password</FormLabel>
              <FormControl>
                <Input type="password" autoComplete="new-password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="size-4 animate-spin" />}
          Set new password
        </Button>
      </form>
    </Form>
  );
}
