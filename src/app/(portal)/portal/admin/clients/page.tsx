import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default async function AdminClientsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/portal/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") redirect("/portal");

  const { data: clients } = await supabase
    .from("clients")
    .select("*")
    .order("created_at", { ascending: false });

  const { data: requests } = await supabase
    .from("requests")
    .select("id, client_id, status");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Clients</h1>
        <Button variant="outline" size="sm">
          + New Client
        </Button>
      </div>

      <div className="grid gap-4">
        {(clients ?? []).map((client) => {
          const clientRequests = (requests ?? []).filter(
            (r) => r.client_id === client.id
          );
          const openCount = clientRequests.filter(
            (r) => r.status !== "done"
          ).length;
          const doneCount = clientRequests.filter(
            (r) => r.status === "done"
          ).length;

          return (
            <Link key={client.id} href={`/portal/admin/clients/${client.slug}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-[#909af7]/10 flex items-center justify-center">
                      <span className="text-[#909af7] font-semibold">
                        {client.name[0]}
                      </span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{client.name}</h3>
                        <Badge
                          variant="outline"
                          className={
                            client.is_active
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-gray-50 text-gray-500"
                          }
                        >
                          {client.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        ${client.retainer_amount ?? 0}/mo &middot; {openCount}{" "}
                        open &middot; {doneCount} done
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}

        {(clients ?? []).length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            No clients yet. Add your first client to get started.
          </div>
        )}
      </div>
    </div>
  );
}
