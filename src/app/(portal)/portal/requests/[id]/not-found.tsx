import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function RequestNotFound() {
  return (
    <div className="max-w-2xl mx-auto flex flex-col items-center justify-center py-20 text-center px-4">
      <h1 className="text-xl font-semibold mb-2">Request not found</h1>
      <p className="text-sm text-muted-foreground mb-6 max-w-md">
        This request doesn&apos;t exist or you don&apos;t have access to it.
      </p>
      <Link href="/portal">
        <Button variant="outline">Back to Board</Button>
      </Link>
    </div>
  );
}
