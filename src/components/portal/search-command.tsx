"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { Comment01Icon, Upload01Icon, Task01Icon } from "@/components/ui/icons";

interface SearchResults {
  requests: {
    id: string;
    title: string;
    description: string | null;
    type: string;
    status: string;
    clients: { name: string } | null;
  }[];
  comments: {
    id: string;
    body: string;
    created_at: string;
    request_id: string;
    requests: { id: string; title: string } | null;
  }[];
  deliverables: {
    id: string;
    file_name: string;
    mime_type: string | null;
    request_id: string;
    requests: { id: string; title: string } | null;
  }[];
}

const typeColors: Record<string, string> = {
  logo: "bg-purple-100 text-purple-700",
  social: "bg-pink-100 text-pink-700",
  web: "bg-blue-100 text-blue-700",
  brand: "bg-amber-100 text-amber-700",
  presentation: "bg-emerald-100 text-emerald-700",
  other: "bg-gray-100 text-gray-700",
};

const statusLabels: Record<string, string> = {
  queued: "Queued",
  in_progress: "In Progress",
  review: "Review",
  done: "Done",
};

export function SearchCommand({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const search = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults(null);
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(
        `/api/portal/search?q=${encodeURIComponent(q)}`
      );
      if (res.ok) {
        const data = await res.json();
        setResults(data);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => search(query), 300);
    return () => clearTimeout(timer);
  }, [query, search]);

  // Reset on close
  useEffect(() => {
    if (!open) {
      setQuery("");
      setResults(null);
    }
  }, [open]);

  const navigate = (requestId: string) => {
    onOpenChange(false);
    router.push(`/portal/requests/${requestId}`);
  };

  const hasResults =
    results &&
    (results.requests.length > 0 ||
      results.comments.length > 0 ||
      results.deliverables.length > 0);

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        placeholder="Search requests, comments, files..."
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        {isLoading && (
          <div className="py-6 text-center text-sm text-muted-foreground">
            Searching...
          </div>
        )}

        {!isLoading && query.length >= 2 && !hasResults && (
          <CommandEmpty>No results found.</CommandEmpty>
        )}

        {!isLoading && query.length < 2 && (
          <div className="py-6 text-center text-sm text-muted-foreground">
            Type at least 2 characters to search
          </div>
        )}

        {results && results.requests.length > 0 && (
          <CommandGroup heading="Requests">
            {results.requests.map((r) => (
              <CommandItem
                key={`req-${r.id}`}
                value={`req-${r.id}-${r.title}`}
                onSelect={() => navigate(r.id)}
                className="cursor-pointer"
              >
                <Task01Icon size={14} className="mr-2 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{r.title}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Badge
                      variant="secondary"
                      className={`text-[9px] px-1 py-0 ${typeColors[r.type] ?? typeColors.other}`}
                    >
                      {r.type}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground">
                      {statusLabels[r.status] ?? r.status}
                    </span>
                    {r.clients?.name && (
                      <span className="text-[10px] text-muted-foreground">
                        · {r.clients.name}
                      </span>
                    )}
                  </div>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {results && results.comments.length > 0 && (
          <CommandGroup heading="Comments">
            {results.comments.map((c) => (
              <CommandItem
                key={`com-${c.id}`}
                value={`com-${c.id}-${c.body.slice(0, 50)}`}
                onSelect={() =>
                  navigate(c.requests?.id ?? c.request_id)
                }
                className="cursor-pointer"
              >
                <Comment01Icon size={14} className="mr-2 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground truncate">
                    on {c.requests?.title ?? "a request"}
                  </p>
                  <p className="text-sm truncate">{c.body}</p>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {results && results.deliverables.length > 0 && (
          <CommandGroup heading="Files">
            {results.deliverables.map((d) => (
              <CommandItem
                key={`del-${d.id}`}
                value={`del-${d.id}-${d.file_name}`}
                onSelect={() =>
                  navigate(d.requests?.id ?? d.request_id)
                }
                className="cursor-pointer"
              >
                <Upload01Icon size={14} className="mr-2 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {d.file_name}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    in {d.requests?.title ?? "a request"}
                  </p>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
}
