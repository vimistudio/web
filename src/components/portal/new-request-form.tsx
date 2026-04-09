"use client";

import { useState, useCallback } from "react";
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
  ArrowRight01Icon,
  ArrowLeft01Icon,
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
  { value: "logo" as const, label: "Logo Design", desc: "Logos, wordmarks, icons", Icon: PenToolIcon },
  { value: "social" as const, label: "Social Media", desc: "Posts, stories, reels", Icon: SmartPhoneIcon },
  { value: "web" as const, label: "Website", desc: "Pages, banners, UI", Icon: BrowserIcon },
  { value: "brand" as const, label: "Branding", desc: "Identity, guidelines", Icon: ColourSwatchIcon },
  { value: "presentation" as const, label: "Presentation", desc: "Decks, slides", Icon: PresentationIcon },
  { value: "other" as const, label: "Something Else", desc: "Tell us what you need", Icon: MoreHorizontalIcon },
] as const;

const priorities = [
  { value: 1, label: "Whenever", desc: "No rush, take your time", Icon: LeafIcon, activeColor: "border-gray-400 bg-gray-50" },
  { value: 2, label: "This Week", desc: "Normal turnaround", Icon: CalendarIcon, activeColor: "border-[#909af7] bg-[#909af7]/5" },
  { value: 3, label: "Urgent", desc: "Need it ASAP", Icon: FireIcon, activeColor: "border-red-400 bg-red-50" },
] as const;

type RequestType = (typeof requestTypes)[number]["value"];

const TOTAL_STEPS = 5;
const STEP_LABELS = ["Name", "Type", "Details", "Timeline", "Inspiration"];

export function NewRequestForm({ clientId, userId, clientName, isAdmin }: NewRequestFormProps) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [title, setTitle] = useState("");
  const [type, setType] = useState<RequestType | null>(null);
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState(2);
  const [dueDate, setDueDate] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const goNext = useCallback(() => {
    if (step < TOTAL_STEPS - 1) setStep((s) => s + 1);
  }, [step]);

  const goBack = useCallback(() => {
    if (step > 0) setStep((s) => s - 1);
    else router.back();
  }, [step, router]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFiles((prev) => [...prev, ...newFiles]);
      newFiles.forEach((file) => {
        if (file.type.startsWith("image/")) {
          const reader = new FileReader();
          reader.onloadend = () => setPreviews((prev) => [...prev, reader.result as string]);
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
        type: type || "other",
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
    if (isAdmin) router.back();
    else router.push("/portal");
    router.refresh();
  };

  const canAdvance =
    step === 0 ? title.trim().length > 0 :
    step === 1 ? type !== null :
    true;

  const isLastStep = step === TOTAL_STEPS - 1;

  return (
    <div className="max-w-lg mx-auto flex flex-col min-h-[calc(100vh-120px)]">
      {/* Top bar: close + step label */}
      <div className="flex items-center justify-between mb-2">
        <button
          onClick={() => router.back()}
          className="text-muted-foreground hover:text-foreground transition-colors p-1"
        >
          <Cancel01Icon size={20} />
        </button>
        {clientName && (
          <span className="text-xs text-muted-foreground">for {clientName}</span>
        )}
      </div>

      {/* Progress dots — left aligned */}
      <div className="flex items-center gap-1.5 mb-8">
        {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
          <div
            key={i}
            className={`rounded-full transition-all duration-500 ease-out ${
              i === step
                ? "w-6 h-1.5 bg-[#909af7]"
                : i < step
                  ? "w-1.5 h-1.5 bg-[#909af7]"
                  : "w-1.5 h-1.5 bg-gray-200"
            }`}
          />
        ))}
      </div>

      {/* Step content */}
      <div className="flex-1" key={step}>
        {/* Step label */}
        <p className="text-xs font-medium text-[#909af7] uppercase tracking-wider mb-2">
          {STEP_LABELS[step]}
        </p>

        {step === 0 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <h2 className="text-2xl font-semibold tracking-tight leading-tight">
              What do you need designed?
            </h2>
            <p className="text-sm text-muted-foreground">
              A short name so your designer knows what to expect.
            </p>
            <Input
              placeholder="e.g. Instagram story templates, Logo refresh..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="h-12 text-base"
              autoFocus
              onKeyDown={(e) => e.key === "Enter" && canAdvance && goNext()}
            />
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <h2 className="text-2xl font-semibold tracking-tight leading-tight">
              What kind of project is this?
            </h2>
            <p className="text-sm text-muted-foreground">
              Pick the closest match. You can always add details later.
            </p>
            <div className="space-y-2">
              {requestTypes.map((t) => {
                const selected = type === t.value;
                return (
                  <button
                    key={t.value}
                    onClick={() => setType(t.value)}
                    className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all text-left ${
                      selected
                        ? "border-[#909af7] bg-[#909af7]/5 shadow-sm"
                        : "border-gray-200 hover:border-gray-300 bg-white"
                    }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                        selected ? "bg-[#909af7]/10 text-[#909af7]" : "bg-gray-100 text-muted-foreground"
                      }`}
                    >
                      <t.Icon size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={`text-sm font-medium ${selected ? "text-[#909af7]" : "text-foreground"}`}>
                        {t.label}
                      </div>
                      <div className="text-xs text-muted-foreground">{t.desc}</div>
                    </div>
                    {selected && (
                      <div className="w-5 h-5 rounded-full bg-[#909af7] flex items-center justify-center shrink-0">
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                          <path d="M2.5 6L5 8.5L9.5 3.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <h2 className="text-2xl font-semibold tracking-tight leading-tight">
              Tell us a bit more
            </h2>
            <p className="text-sm text-muted-foreground">
              What should it feel like? Who&apos;s the audience? Any specific sizes or formats?
            </p>
            <Textarea
              placeholder="I need 3 Instagram story templates for our weekly specials. Warm, appetizing vibe. Brand colors. Include our logo and a spot for food photos..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[160px] resize-none text-base"
              autoFocus
            />
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight leading-tight">
                When do you need it?
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Set the pace for your designer.
              </p>
            </div>
            <div className="space-y-2">
              {priorities.map((p) => {
                const selected = priority === p.value;
                return (
                  <button
                    key={p.value}
                    onClick={() => setPriority(p.value)}
                    className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all text-left ${
                      selected ? p.activeColor + " shadow-sm" : "border-gray-200 hover:border-gray-300 bg-white"
                    }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                        selected ? "bg-white/60" : "bg-gray-100"
                      } text-muted-foreground`}
                    >
                      <p.Icon size={20} />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium">{p.label}</div>
                      <div className="text-xs text-muted-foreground">{p.desc}</div>
                    </div>
                  </button>
                );
              })}
            </div>
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">
                Due date <span className="opacity-60">(optional)</span>
              </label>
              <Input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
                className="h-12"
              />
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <h2 className="text-2xl font-semibold tracking-tight leading-tight">
              Any inspiration?
            </h2>
            <p className="text-sm text-muted-foreground">
              Upload screenshots, Pinterest pins, or examples you love. Or skip this step.
            </p>
            <div className="flex flex-wrap gap-3">
              {files.map((file, i) => (
                <div
                  key={i}
                  className="relative w-24 h-24 rounded-xl overflow-hidden bg-gray-100 flex items-center justify-center group"
                >
                  {previews[i] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={previews[i]} alt={file.name} className="w-full h-full object-cover" />
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
              <label className="w-24 h-24 rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center cursor-pointer hover:border-[#909af7] hover:bg-[#909af7]/5 transition-colors">
                <PlusSignIcon size={20} className="text-muted-foreground" />
                <span className="text-[10px] text-muted-foreground mt-1">Add file</span>
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
        )}
      </div>

      {/* Bottom bar: Back + Continue */}
      <div className="flex items-center gap-3 pt-6 pb-2 mt-auto">
        {step > 0 ? (
          <Button
            variant="outline"
            onClick={goBack}
            className="h-12 px-6 rounded-xl gap-2 text-muted-foreground"
          >
            <ArrowLeft01Icon size={16} />
            Back
          </Button>
        ) : (
          <div />
        )}

        <Button
          onClick={isLastStep ? handleSubmit : goNext}
          disabled={!canAdvance || isSubmitting}
          className="flex-1 h-12 bg-[#909af7] hover:bg-[#7b85e8] text-white font-medium rounded-xl gap-2"
        >
          {isSubmitting
            ? "Submitting..."
            : isLastStep
              ? "Submit Request"
              : "Continue"}
          {!isLastStep && !isSubmitting && <ArrowRight01Icon size={16} />}
        </Button>
      </div>
    </div>
  );
}
