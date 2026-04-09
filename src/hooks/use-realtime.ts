import { useEffect, useId, useRef } from "react";
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
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  // useId() is stable per component instance — prevents collisions
  // when the same hook is used in multiple mounted instances
  const instanceId = useId();

  useEffect(() => {
    const supabase = createClient();
    const channelName = `rt-${table}-${filter ?? "all"}-${instanceId}`;

    const channel = supabase
      .channel(channelName)
      .on(
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table, schema, event, filter, instanceId]);
}
