"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Target } from "lucide-react";
import Link from "next/link";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) {
      toast.error("Passwort muss mindestens 8 Zeichen lang sein");
      return;
    }

    setIsLoading(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/api/auth/callback`,
        },
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success("Registrierung erfolgreich! Bitte bestatige deine E-Mail.");
      router.push("/login");
    } catch {
      toast.error("Registrierung fehlgeschlagen");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <Card className="w-full max-w-sm bg-surface-2 border-white/[0.06]">
        <CardHeader className="text-center">
          <Link href="/" className="inline-flex items-center justify-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-emerald/20 flex items-center justify-center">
              <Target className="w-5 h-5 text-emerald" />
            </div>
            <span className="text-lg font-semibold">PingCoach</span>
          </Link>
          <CardTitle>Registrieren</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-Mail</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="deine@email.de"
                required
                className="bg-white/[0.04] border-white/[0.08]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Passwort</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min. 8 Zeichen"
                required
                minLength={8}
                className="bg-white/[0.04] border-white/[0.08]"
              />
            </div>

            <label className="flex items-start gap-2 text-xs text-text-muted">
              <input type="checkbox" required className="mt-0.5 accent-emerald" />
              <span>
                Ich akzeptiere die{" "}
                <Link href="/datenschutz" className="text-emerald hover:underline">
                  Datenschutzerklaerung
                </Link>
              </span>
            </label>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 bg-emerald hover:bg-emerald-dark text-white cursor-pointer"
            >
              {isLoading ? "Wird registriert..." : "Kostenlos registrieren"}
            </Button>
          </form>
          <p className="text-center text-sm text-text-muted mt-4">
            Bereits registriert?{" "}
            <Link href="/login" className="text-emerald hover:underline">
              Anmelden
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
