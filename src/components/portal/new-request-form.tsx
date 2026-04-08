"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Cancel01Icon } from "@hugeicons-pro/core-stroke-rounded";
import { PlusSignIcon } from "@hugeicons-pro/core-stroke-rounded";
import { Image01Icon } from "@hugeicons-pro/core-stroke-rounded";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

interface NewRequestFormProps {
  clientId: string;
  userId: string;
}

const requestTypes = [
  { value: "logo" as const, label: "Logo", icon: "◇" },
  { value: "social" as const, label: "Social", icon: "◻" },
  { value: "web" as const, label: "Web", icon: "◎" },
  { value: "brand" as const, label: "Brand", icon: "♦" },
  { value: "other" as const, label: "Other", icon: "•••" },
] as const;

type RequestType = (typeof requestTypes)[number]["value"];

export function NewRequestForm({ clientId, userId }: NewRequestFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [type, setType] = useState<RequestType>("social");
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!title.trim() || isSubmitting) return;
    setIsSubmitting(true);

    const supabase = createClient();

    // Create the request
    const { data: request, error } = await supabase
      .from("requests")
      .insert({
        client_id: clientId,
        created_by: userId,
        title: title.trim(),
        description: description.trim() || null,
        type,
        status: "queued",
      })
      .select()
      .single();

    if (error || !request) {
      setIsSubmitting(false);
      return;
    }

    // Upload reference images if any
    if (files.length > 0) {
      for (const file of files) {
        const filePath = `${clientId}/${request.id}/${Date.now()}-${file.name}`;
        const { error: uploadError } = await supabase.storage
          .from("references")
          .upload(filePath, file);

        if (!uploadError) {
          await supabase.from("reference_images").insert({
            request_id: request.id,
            uploaded_by: userId,
            file_name: file.name,
            file_path: filePath,
            file_size: file.size,
            mime_type: file.type,
          });
        }
      }
    }

    setIsSubmitting(false);
    router.push("/portal");
    router.refresh();
  };

  return (
    <div className="max-w-lg mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link
          href="/portal"
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <Cancel01Icon size={20} />
        </Link>
        <h1 className="font-semibold">New Request</h1>
        <div className="w-5" />
      </div>

      {/* Title */}
      <div className="space-y-2">
        <Label className="text-xs font-medium tracking-wider text-muted-foreground">
          TITLE
        </Label>
        <Input
          placeholder="e.g. Email newsletter header"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="h-12"
        />
      </div>

      {/* Type */}
      <div className="space-y-2">
        <Label className="text-xs font-medium tracking-wider text-muted-foreground">
          TYPE
        </Label>
        <div className="flex flex-wrap gap-2">
          {requestTypes.map((t) => (
            <button
              key={t.value}
              onClick={() => setType(t.value)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full border text-sm transition-colors ${
                type === t.value
                  ? "border-[#909af7] bg-[#909af7]/10 text-[#909af7]"
                  : "border-gray-200 text-muted-foreground hover:border-gray-300"
              }`}
            >
              <span>{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label className="text-xs font-medium tracking-wider text-muted-foreground">
          DESCRIPTION
        </Label>
        <Textarea
          placeholder="Describe what you need..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="min-h-[120px] resize-none"
        />
      </div>

      {/* Reference Images */}
      <div className="space-y-2">
        <Label className="text-xs font-medium tracking-wider text-muted-foreground">
          REFERENCES
        </Label>
        <div className="flex flex-wrap gap-2">
          {files.map((file, i) => (
            <div
              key={i}
              className="relative w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center group"
            >
              <span className="text-[10px] text-muted-foreground">
                {file.name.split(".").pop()?.toUpperCase()}
              </span>
              <button
                onClick={() => removeFile(i)}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Cancel01Icon size={10} />
              </button>
            </div>
          ))}
          <label className="w-16 h-16 rounded-lg border-2 border-dashed border-gray-200 flex flex-col items-center justify-center cursor-pointer hover:border-gray-300 transition-colors">
            <PlusSignIcon size={16} className="text-muted-foreground" />
            <span className="text-[10px] text-muted-foreground mt-0.5">
              Add
            </span>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Submit */}
      <Button
        onClick={handleSubmit}
        disabled={!title.trim() || isSubmitting}
        className="w-full h-12 bg-[#909af7] hover:bg-[#7b85e8] text-white font-medium"
      >
        {isSubmitting ? "Submitting..." : "Submit Request"}
      </Button>
    </div>
  );
}
