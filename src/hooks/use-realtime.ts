import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";

type PostgresEvent = "INSERT" | "UPDATE" | "DELETE" | "*";

interface UseRealtimeOptions {
  table: string;
  schema?: string;
  event?: PostgresEvent;
  filter?: string;
  onEvent: (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => void;
}

export function useRealtime({
  table,
  schema = "public",
  event = "*",
  filter,
  onEvent,
}: UseRealtimeOptions) {
  useEffect(() => {
    const supabase = createClient();

    const channelConfig: Record<string, string> = {
      event,
      schema,
      table,
    };

    if (filter) {
      channelConfig.filter = filter;
    }

    const channel = supabase
      .channel(`realtime-${table}-${filter ?? "all"}`)
      .on(
        "postgres_changes" as never,
        channelConfig,
        (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
          onEvent(payload);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [table, schema, event, filter, onEvent]);
}
