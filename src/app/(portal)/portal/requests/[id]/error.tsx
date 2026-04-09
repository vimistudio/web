"use client";

import { Button } from "@/components/ui/button";

export default function RequestDetailError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="max-w-2xl mx-auto flex flex-col items-center justify-center py-20 text-center px-4">
      <h1 className="text-xl font-semibold mb-2">Something went wrong</h1>
      <p className="text-sm text-muted-foreground mb-6 max-w-md">
        We couldn&apos;t load this request. This might be a temporary issue.
      </p>
      <Button onClick={reset} variant="outline">
        Try again
      </Button>
    </div>
  );
}
