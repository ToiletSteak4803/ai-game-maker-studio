"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Gamepad2, Mail, ArrowLeft, Loader2 } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [error, setError] = useState("");
  const searchParams = useSearchParams();

  const errorParam = searchParams.get("error");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong");
        return;
      }

      setIsSent(true);
    } catch {
      setError("Failed to send login link. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isSent) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 dark:bg-zinc-950">
        <div className="w-full max-w-md text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900/30">
            <Mail className="h-8 w-8 text-indigo-600" />
          </div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            Check your email
          </h1>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">
            We sent a login link to{" "}
            <span className="font-medium text-zinc-900 dark:text-zinc-50">
              {email}
            </span>
          </p>
          <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-500">
            Click the link in the email to sign in. The link expires in 15
            minutes.
          </p>
          <Button
            variant="ghost"
            className="mt-6"
            onClick={() => {
              setIsSent(false);
              setEmail("");
            }}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 dark:bg-zinc-950">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center gap-2">
            <Gamepad2 className="h-8 w-8 text-indigo-600" />
            <span className="text-xl font-bold">AI Game Maker</span>
          </Link>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <h1 className="text-center text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            Sign in to your account
          </h1>
          <p className="mt-2 text-center text-sm text-zinc-600 dark:text-zinc-400">
            Enter your email and we&apos;ll send you a magic link
          </p>

          {(error || errorParam) && (
            <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
              {error ||
                (errorParam === "missing_token" && "Missing login token") ||
                (errorParam === "invalid_token" &&
                  "Invalid or expired login link") ||
                (errorParam === "server_error" && "Server error, please try again")}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-2"
                autoComplete="email"
                autoFocus
              />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending link...
                </>
              ) : (
                "Send magic link"
              )}
            </Button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
          Don&apos;t have an account? Just enter your email above and we&apos;ll
          create one for you.
        </p>
      </div>
    </div>
  );
}
