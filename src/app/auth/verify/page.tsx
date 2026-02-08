import { Loader2 } from "lucide-react";

export default function VerifyPage() {
  // This page briefly shows while the GET /api/auth/verify route processes
  // and redirects the user
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
      <div className="text-center">
        <Loader2 className="mx-auto h-8 w-8 animate-spin text-indigo-600" />
        <p className="mt-4 text-zinc-600 dark:text-zinc-400">
          Verifying your login...
        </p>
      </div>
    </div>
  );
}
