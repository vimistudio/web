"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Cancel01Icon,
  PlusSignIcon,
  PenToolIcon,
  SmartPhoneIcon,
  BrowserIcon,
  ColourSwatchIcon,
  PresentationIcon,
  MoreHorizontalIcon,
  LeafIcon,
  CalendarIcon,
  FireIcon,
} from "@/components/ui/icons";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

interface NewRequestFormProps {
  clientId: string;
  userId: string;
  clientName?: string;
  isAdmin?: boolean;
}

const requestTypes = [
  { value: "logo" as const, label: "Logo", Icon: PenToolIcon },
  { value: "social" as const, label: "Social", Icon: SmartPhoneIcon },
  { value: "web" as const, label: "Web", Icon: BrowserIcon },
  { value: "brand" as const, label: "Brand", Icon: ColourSwatchIcon },
  { value: "presentation" as const, label: "Deck", Icon: PresentationIcon },
  { value: "other" as const, label: "Other", Icon: MoreHorizontalIcon },
] as const;

const priorities = [
  { value: 1, label: "Whenever", hint: "No rush", Icon: LeafIcon, color: "border-gray-200 text-muted-foreground", activeBg: "border-gray-400 bg-gray-50 text-foreground" },
  { value: 2, label: "This week", hint: "Normal", Icon: CalendarIcon, color: "border-gray-200 text-muted-foreground", activeBg: "border-[#909af7] bg-[#909af7]/10 text-[#909af7]" },
  { value: 3, label: "Urgent", hint: "ASAP", Icon: FireIcon, color: "border-gray-200 text-muted-foreground", activeBg: "border-red-400 bg-red-50 text-red-600" },
] as const;

type RequestType = (typeof requestTypes)[number]["value"];

export function NewRequestForm({ clientId, userId, clientName, isAdmin }: NewRequestFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [type, setType] = useState<RequestType>("social");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState(2);
  const [dueDate, setDueDate] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFiles((prev) => [...prev, ...newFiles]);

      // Generate thumbnail previews
      newFiles.forEach((file) => {
        if (file.type.startsWith("image/")) {
          const reader = new FileReader();
          reader.onloadend = () => {
            setPreviews((prev) => [...prev, reader.result as string]);
          };
          reader.readAsDataURL(file);
        } else {
          setPreviews((prev) => [...prev, ""]);
        }
      });
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!title.trim() || isSubmitting) return;
    setIsSubmitting(true);

    const supabase = createClient();

    const { data: request, error } = await supabase
      .from("requests")
      .insert({
        client_id: clientId,
        created_by: userId,
        title: title.trim(),
        description: description.trim() || null,
        type,
        priority,
        due_date: dueDate || null,
        status: "queued",
      })
      .select()
      .single();

    if (error || !request) {
      toast.error("Couldn't submit your request. Please try again.");
      setIsSubmitting(false);
      return;
    }

    // Upload reference images
    if (files.length > 0) {
      await Promise.all(
        files.map(async (file) => {
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
        })
      );
    }

    toast.success("Request submitted! Your designer will see it shortly.");
    setIsSubmitting(false);

    if (isAdmin) {
      router.back();
    } else {
      router.push("/portal");
    }
    router.refresh();
  };

  return (
    <div className="max-w-lg mx-auto space-y-8 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="text-muted-foreground hover:text-foreground transition-colors p-1"
        >
          <Cancel01Icon size={20} />
        </button>
        <div className="text-center">
          <h1 className="font-semibold text-lg">New Request</h1>
          {clientName && (
            <p className="text-xs text-muted-foreground">for {clientName}</p>
          )}
        </div>
        <div className="w-7" />
      </div>

      {/* Step 1: What do you need? */}
      <div className="space-y-3">
        <div>
          <label className="text-sm font-medium">
            What do you need?
          </label>
          <p className="text-xs text-muted-foreground mt-0.5">
            A short name for your request
          </p>
        </div>
        <Input
          placeholder="e.g. Instagram story templates, Logo refresh..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="h-12"
        />
      </div>

      {/* Step 2: What kind? */}
      <div className="space-y-3">
        <label className="text-sm font-medium">
          What kind of project?
        </label>
        <div className="grid grid-cols-3 gap-2">
          {requestTypes.map((t) => (
            <button
              key={t.value}
              onClick={() => setType(t.value)}
              className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-center transition-all ${
                type === t.value
                  ? "border-[#909af7] bg-[#909af7]/10 text-[#909af7] shadow-sm"
                  : "border-gray-200 text-muted-foreground hover:border-gray-300"
              }`}
            >
              <t.Icon size={20} />
              <span className="text-xs font-medium">{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Step 3: Tell us more */}
      <div className="space-y-3">
        <div>
          <label className="text-sm font-medium">
            Tell us more
          </label>
          <p className="text-xs text-muted-foreground mt-0.5">
            What should it feel like? Who&apos;s the audience? Any specific sizes?
          </p>
        </div>
        <Textarea
          placeholder="I need 3 Instagram story templates for our weekly specials. Warm, appetizing vibe. Brand colors. Include our logo and a spot for food photos..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="min-h-[120px] resize-none"
        />
      </div>

      {/* Step 4: How urgent? */}
      <div className="space-y-3">
        <label className="text-sm font-medium">
          How urgent is this?
        </label>
        <div className="grid grid-cols-3 gap-2">
          {priorities.map((p) => (
            <button
              key={p.value}
              onClick={() => setPriority(p.value)}
              className={`flex flex-col items-center gap-1 p-3 rounded-xl border transition-all ${
                priority === p.value ? p.activeBg : p.color
              }`}
            >
              <p.Icon size={18} />
              <span className="text-xs font-medium">{p.label}</span>
              <span className="text-[10px] opacity-60">{p.hint}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Step 5: Due date (optional) */}
      <div className="space-y-3">
        <div>
          <label className="text-sm font-medium">
            Due date
          </label>
          <p className="text-xs text-muted-foreground mt-0.5">
            Optional. Leave blank if flexible.
          </p>
        </div>
        <Input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          min={new Date().toISOString().split("T")[0]}
          className="h-12"
        />
      </div>

      {/* Step 6: Inspiration */}
      <div className="space-y-3">
        <div>
          <label className="text-sm font-medium">
            Any inspiration?
          </label>
          <p className="text-xs text-muted-foreground mt-0.5">
            Upload screenshots, Pinterest pins, or examples you love
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {files.map((file, i) => (
            <div
              key={i}
              className="relative w-20 h-20 rounded-xl overflow-hidden bg-gray-100 flex items-center justify-center group"
            >
              {previews[i] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={previews[i]}
                  alt={file.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-[10px] text-muted-foreground">
                  {file.name.split(".").pop()?.toUpperCase()}
                </span>
              )}
              <button
                onClick={() => removeFile(i)}
                className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Cancel01Icon size={16} />
              </button>
            </div>
          ))}
          <label className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center cursor-pointer hover:border-[#909af7] hover:bg-[#909af7]/5 transition-colors">
            <PlusSignIcon size={18} className="text-muted-foreground" />
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
        className="w-full h-12 bg-[#909af7] hover:bg-[#7b85e8] text-white font-medium rounded-xl"
      >
        {isSubmitting ? "Submitting..." : "Submit Request"}
      </Button>
    </div>
  );
}
