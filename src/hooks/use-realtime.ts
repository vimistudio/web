import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

type PostgresEvent = "INSERT" | "UPDATE" | "DELETE" | "*";

interface UseRealtimeOptions {
  table: string;
  schema?: string;
  event?: PostgresEvent;
  filter?: string;
  onEvent: (payload: unknown) => void;
}

export function useRealtime({
  table,
  schema = "public",
  event = "*",
  filter,
  onEvent,
}: UseRealtimeOptions) {
  // Use a ref to avoid re-subscribing when the callback changes
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  useEffect(() => {
    const supabase = createClient();
    const channelName = `rt-${table}-${filter ?? "all"}-${Date.now()}`;

    const channel = supabase.channel(channelName);

    channel.on(
      "postgres_changes" as "system",
      {
        event,
        schema,
        table,
        ...(filter ? { filter } : {}),
      },
      (payload: unknown) => {
        onEventRef.current(payload);
      }
    );

    channel.subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // Only re-subscribe when the subscription parameters change, not the callback
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table, schema, event, filter]);
}
