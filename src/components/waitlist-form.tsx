"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export function WaitlistForm() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;

    setIsLoading(true);
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Fehler beim Eintragen");
      }

      setIsSubmitted(true);
      toast.success("Du bist auf der Warteliste!");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Etwas ist schiefgelaufen"
      );
    } finally {
      setIsLoading(false);
    }
  }

  if (isSubmitted) {
    return (
      <div className="flex items-center gap-2 text-emerald font-medium">
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        Du bist dabei! Wir melden uns, sobald PingCoach startet.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md">
      <Input
        type="email"
        placeholder="Deine E-Mail-Adresse"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        className="flex-1 h-12 bg-white/[0.04] border-white/[0.08] placeholder:text-text-muted focus:border-emerald/40 focus:ring-emerald/20"
      />
      <Button
        type="submit"
        disabled={isLoading}
        className="h-12 px-6 bg-emerald hover:bg-emerald-dark text-white font-medium cursor-pointer"
      >
        {isLoading ? "Wird eingetragen..." : "Auf die Warteliste"}
      </Button>
    </form>
  );
}
