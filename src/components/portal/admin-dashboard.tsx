"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { UserGroupIcon } from "@hugeicons-pro/core-stroke-rounded";
import { Task01Icon } from "@hugeicons-pro/core-stroke-rounded";
import { ViewIcon } from "@hugeicons-pro/core-stroke-rounded";
import { DollarCircleIcon } from "@hugeicons-pro/core-stroke-rounded";
import { ArrowRight01Icon } from "@hugeicons-pro/core-stroke-rounded";
import { PlusSignIcon } from "@hugeicons-pro/core-stroke-rounded";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

interface ClientSummary {
  id: string;
  name: string;
  slug: string;
  retainer_amount: number | null;
  is_active: boolean;
  counts: {
    queued: number;
    in_progress: number;
    review: number;
    done: number;
  };
}

interface Stats {
  totalClients: number;
  openRequests: number;
  needsReview: number;
  monthlyRevenue: number;
}

interface Activity {
  id: string;
  body: string;
  created_at: string;
  profiles: { full_name: string | null; avatar_url: string | null } | null;
  requests: { title: string; client_id: string } | null;
}

interface AdminDashboardProps {
  stats: Stats;
  clients: ClientSummary[];
  recentActivity: Activity[];
}

const statCards = [
  { key: "totalClients" as const, label: "ACTIVE CLIENTS", icon: UserGroupIcon, color: "text-foreground" },
  { key: "openRequests" as const, label: "OPEN REQUESTS", icon: Task01Icon, color: "text-blue-600" },
  { key: "needsReview" as const, label: "NEEDS REVIEW", icon: ViewIcon, color: "text-amber-500" },
  { key: "monthlyRevenue" as const, label: "MONTHLY REVENUE", icon: DollarCircleIcon, color: "text-emerald-500" },
];

export function AdminDashboard({ stats, clients, recentActivity }: AdminDashboardProps) {
  const now = new Date();
  const greeting = now.getHours() < 12 ? "Good morning" : now.getHours() < 18 ? "Good afternoon" : "Good evening";
  const dateStr = now.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">
            {greeting}, Carlos
          </h1>
          <p className="text-muted-foreground text-sm mt-1">{dateStr}</p>
        </div>
        <Button variant="outline" className="gap-2">
          <PlusSignIcon size={16} />
          New Client
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => {
          const value = stats[card.key];
          const display = card.key === "monthlyRevenue" ? `$${value}` : value;
          return (
            <Card key={card.key}>
              <CardContent className="pt-6">
                <p className="text-xs font-medium text-muted-foreground tracking-wider">
                  {card.label}
                </p>
                <p className={`text-3xl font-semibold mt-2 ${card.color}`}>
                  {display}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Clients Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Your Clients</h2>
          <Link
            href="/portal/admin/clients"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            View all
          </Link>
        </div>

        <div className="space-y-4">
          {clients.map((client) => (
            <Card key={client.id} className="overflow-hidden">
              <div className="bg-gradient-to-r from-[#909af7]/10 to-[#909af7]/5 p-4 sm:p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 bg-[#909af7]/20">
                      <AvatarFallback className="bg-[#909af7]/20 text-[#909af7] font-semibold">
                        {client.name[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold">{client.name}</h3>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className="bg-emerald-50 text-emerald-700 border-emerald-200"
                  >
                    Active
                  </Badge>
                </div>

                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm mb-4">
                  <div>
                    <span className="text-muted-foreground">RETAINER</span>
                    <p className="font-semibold">${client.retainer_amount ?? 0}/mo</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">QUEUED</span>
                    <p className="font-semibold">{client.counts.queued}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">IN PROGRESS</span>
                    <p className="font-semibold text-blue-600">{client.counts.in_progress}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">REVIEW</span>
                    <p className="font-semibold text-amber-500">{client.counts.review}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">DONE</span>
                    <p className="font-semibold text-emerald-500">{client.counts.done}</p>
                  </div>
                </div>

                <Link href={`/portal/admin/clients/${client.slug}`}>
                  <Button variant="outline" size="sm" className="gap-2">
                    Open Board
                    <ArrowRight01Icon size={12} />
                  </Button>
                </Link>
              </div>
            </Card>
          ))}

          {clients.length === 0 && (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <p className="text-muted-foreground mb-4">No clients yet</p>
                <Button variant="outline" className="gap-2">
                  <PlusSignIcon size={16} />
                  Add your first client
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
        <Card>
          <CardContent className="pt-6">
            {recentActivity.length > 0 ? (
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-[#909af7] mt-2 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">
                        <span className="font-medium">
                          {activity.profiles?.full_name ?? "Someone"}
                        </span>{" "}
                        commented on{" "}
                        <span className="font-medium">
                          {activity.requests?.title ?? "a request"}
                        </span>
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {formatDistanceToNow(new Date(activity.created_at), {
                          addSuffix: true,
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                No recent activity yet. Activity will appear here when clients
                submit requests and leave comments.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
