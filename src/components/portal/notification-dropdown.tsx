"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Notification03Icon, CheckmarkCircle01Icon } from "@/components/ui/icons";
import { createClient } from "@/lib/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { useRealtime } from "@/hooks/use-realtime";
import { toast } from "sonner";

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string | null;
  is_read: boolean;
  request_id: string | null;
  created_at: string;
  actor_id: string | null;
  profiles: { full_name: string | null; avatar_url: string | null } | null;
}

interface NotificationDropdownProps {
  variant?: "light" | "dark";
}

import { Comment01Icon, ArrowRight01Icon, Upload01Icon } from "@/components/ui/icons";

export function NotificationDropdown({ variant = "light" }: NotificationDropdownProps) {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  const fetchNotifications = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("notifications")
      .select("*, profiles!notifications_actor_id_fkey(full_name, avatar_url)")
      .order("created_at", { ascending: false })
      .limit(20);

    if (data) {
      setNotifications(data as Notification[]);
      setUnreadCount(data.filter((n) => !n.is_read).length);
    }
  }, []);

  // Fetch on mount and when popover opens
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  useEffect(() => {
    if (isOpen) fetchNotifications();
  }, [isOpen, fetchNotifications]);

  // Realtime: live notification updates
  useRealtime({
    table: "notifications",
    event: "INSERT",
    onEvent: (payload) => {
      const newNotif = (payload as { new?: Record<string, unknown> }).new;
      if (newNotif) {
        fetchNotifications();
        toast(newNotif.title as string, { duration: 4000 });
      }
    },
  });

  const markAllRead = async () => {
    const supabase = createClient();
    const unreadIds = notifications.filter((n) => !n.is_read).map((n) => n.id);
    if (unreadIds.length === 0) return;

    await supabase
      .from("notifications")
      .update({ is_read: true })
      .in("id", unreadIds);

    setNotifications((prev) =>
      prev.map((n) => ({ ...n, is_read: true }))
    );
    setUnreadCount(0);
  };

  const handleClick = async (notification: Notification) => {
    // Mark as read
    if (!notification.is_read) {
      const supabase = createClient();
      await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("id", notification.id);

      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notification.id ? { ...n, is_read: true } : n
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }

    setIsOpen(false);
    if (notification.request_id) {
      router.push(`/portal/requests/${notification.request_id}`);
    }
  };

  const iconColor =
    variant === "dark"
      ? "text-[#4a4d66] hover:text-[#6B6F99]"
      : "text-gray-400 hover:text-gray-600";

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button className={`relative p-2 min-w-[44px] min-h-[44px] flex items-center justify-center transition-colors ${iconColor}`}>
          <Notification03Icon size={20} />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0 max-h-[400px] overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h3 className="text-sm font-semibold">Notifications</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-7 text-muted-foreground"
              onClick={markAllRead}
            >
              <CheckmarkCircle01Icon size={12} className="mr-1" />
              Mark all read
            </Button>
          )}
        </div>

        <div className="overflow-y-auto max-h-[340px]">
          {notifications.length > 0 ? (
            notifications.map((n) => (
              <button
                key={n.id}
                onClick={() => handleClick(n)}
                className={`w-full text-left px-4 py-3 hover:bg-accent/50 transition-colors flex gap-3 border-b last:border-b-0 ${
                  !n.is_read ? "bg-[#909af7]/5" : ""
                }`}
              >
                <div className="h-7 w-7 shrink-0 mt-0.5 rounded-full bg-[#909af7]/10 flex items-center justify-center">
                  {n.type === "comment_added" && <Comment01Icon size={14} className="text-[#909af7]" />}
                  {n.type === "status_changed" && <ArrowRight01Icon size={14} className="text-[#909af7]" />}
                  {n.type === "deliverable_uploaded" && <Upload01Icon size={14} className="text-[#909af7]" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm leading-tight ${!n.is_read ? "font-medium" : ""}`}>
                    {n.title}
                  </p>
                  {n.body && (
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">
                      {n.body}
                    </p>
                  )}
                  <p className="text-[10px] text-muted-foreground/70 mt-1">
                    {formatDistanceToNow(new Date(n.created_at), {
                      addSuffix: true,
                    })}
                  </p>
                </div>
                {!n.is_read && (
                  <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0 mt-1.5" />
                )}
              </button>
            ))
          ) : (
            <div className="py-8 text-center">
              <p className="text-sm text-muted-foreground">You&apos;re all caught up</p>
              <p className="text-xs text-muted-foreground/60 mt-1">We&apos;ll notify you when there are updates</p>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
