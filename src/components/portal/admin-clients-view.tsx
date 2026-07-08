"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PlusSignIcon } from "@/components/ui/icons";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";

interface ClientSummary {
  id: string;
  name: string;
  slug: string;
  retainer_amount: number | null;
  is_active: boolean;
  created_at: string;
  logo_url?: string | null;
  openCount: number;
  doneCount: number;
}

interface AdminClientsViewProps {
  clients: ClientSummary[];
}

export function AdminClientsView({ clients }: AdminClientsViewProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [retainer, setRetainer] = useState("");
  const [locale, setLocale] = useState("en");
  const [logoUrl, setLogoUrl] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateClient = async () => {
    if (!name.trim() || isCreating) return;
    setIsCreating(true);

    const slug = name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    const supabase = createClient();
    const { error } = await supabase.from("clients").insert({
      name: name.trim(),
      slug,
      retainer_amount: retainer ? parseInt(retainer) : 0,
      locale,
      logo_url: logoUrl.trim() || null,
    });

    if (!error) {
      setName("");
      setRetainer("");
      setLocale("en");
      setLogoUrl("");
      setIsOpen(false);
      router.refresh();
    }

    setIsCreating(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Clients</h1>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="gap-2">
              <PlusSignIcon size={16} />
              New Client
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Client</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label>Client Name</Label>
                <Input
                  placeholder="e.g. Save My Dish"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Monthly Retainer ($)</Label>
                <Input
                  type="number"
                  placeholder="e.g. 400"
                  value={retainer}
                  onChange={(e) => setRetainer(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Language</Label>
                <Select value={locale} onValueChange={setLocale}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent position="popper" className="bg-white border shadow-lg z-50">
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="es">Español</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Logo URL</Label>
                <Input
                  type="url"
                  placeholder="https://…/logo.svg"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                />
              </div>
              <Button
                onClick={handleCreateClient}
                disabled={!name.trim() || isCreating}
                className="w-full bg-primary hover:bg-primary/90"
              >
                {isCreating ? "Creating..." : "Create Client"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {clients.map((client) => (
          <Link
            key={client.id}
            href={`/portal/admin/clients/${client.slug}`}
          >
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center overflow-hidden">
                    {client.logo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={client.logo_url}
                        alt={client.name}
                        className="w-full h-full object-contain p-1"
                      />
                    ) : (
                      <Image
                        src="/vimi-logo-dark.svg"
                        alt={client.name}
                        width={80}
                        height={26}
                        className="h-4 w-auto opacity-60"
                      />
                    )}
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
                      ${client.retainer_amount ?? 0}/mo &middot;{" "}
                      {client.openCount} open &middot; {client.doneCount} done
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}

        {clients.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            No clients yet. Add your first client to get started.
          </div>
        )}
      </div>
    </div>
  );
}
