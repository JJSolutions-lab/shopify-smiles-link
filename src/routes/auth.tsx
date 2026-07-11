import { createFileRoute, useNavigate, useSearch, redirect } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { z } from "zod";

const authSearchSchema = z.object({ next: z.string().optional() });

export const Route = createFileRoute("/auth")({
  validateSearch: authSearchSchema,
  head: () => ({ meta: [{ title: "Sign in — Elegantero" }] }),
  beforeLoad: async ({ search }) => {
    const { data } = await supabase.auth.getSession();
    if (data.session) throw redirect({ to: search.next ?? "/account/orders" });
  },
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const search = useSearch({ from: "/auth" });
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const fn = mode === "signin"
      ? supabase.auth.signInWithPassword({ email, password })
      : supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin } });
    const { error } = await fn;
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success(mode === "signin" ? "Welcome back." : "Account created.");
    navigate({ to: search.next ?? "/account/orders" });
  };

  return (
    <div className="mx-auto max-w-md px-4 py-20">
      <h1 className="font-serif text-4xl text-center mb-2">
        {mode === "signin" ? "Sign in" : "Create account"}
      </h1>
      <p className="text-center text-sm text-muted-foreground mb-8">
        {mode === "signin" ? "Access your orders." : "Track your orders and check out faster."}
      </p>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
        </div>
        <div>
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} autoComplete={mode === "signin" ? "current-password" : "new-password"} />
        </div>
        <Button type="submit" disabled={loading} className="w-full h-12 text-xs uppercase tracking-widest">
          {loading ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
        </Button>
      </form>
      <p className="text-center text-sm text-muted-foreground mt-6">
        {mode === "signin" ? "New to Elegantero?" : "Already have an account?"}{" "}
        <button className="underline" onClick={() => setMode(mode === "signin" ? "signup" : "signin")}>
          {mode === "signin" ? "Create account" : "Sign in"}
        </button>
      </p>
    </div>
  );
}
