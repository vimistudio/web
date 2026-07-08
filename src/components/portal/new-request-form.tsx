"use client";

import { useState, useCallback, useEffect } from "react";
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
  Task01Icon,
} from "@/components/ui/icons";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { fireConfetti } from "@/lib/fire-confetti";
import { useLocale } from "@/components/portal/locale-provider";
import { type PortalKey } from "@/lib/portal-i18n";

const requestTypes = [
  { value: "logo" as const, labelKey: "form.type.logo" as PortalKey, descKey: "form.type.logo.desc" as PortalKey, Icon: PenToolIcon },
  { value: "social" as const, labelKey: "form.type.social" as PortalKey, descKey: "form.type.social.desc" as PortalKey, Icon: SmartPhoneIcon },
  { value: "web" as const, labelKey: "form.type.web" as PortalKey, descKey: "form.type.web.desc" as PortalKey, Icon: BrowserIcon },
  { value: "brand" as const, labelKey: "form.type.brand" as PortalKey, descKey: "form.type.brand.desc" as PortalKey, Icon: ColourSwatchIcon },
  { value: "presentation" as const, labelKey: "form.type.presentation" as PortalKey, descKey: "form.type.presentation.desc" as PortalKey, Icon: PresentationIcon },
  { value: "other" as const, labelKey: "form.type.other" as PortalKey, descKey: "form.type.other.desc" as PortalKey, Icon: MoreHorizontalIcon },
];

const priorities = [
  { value: 1, labelKey: "form.priority.whenever" as PortalKey, descKey: "form.priority.whenever.desc" as PortalKey, Icon: LeafIcon, activeColor: "border-gray-400 bg-gray-50" },
  { value: 2, labelKey: "form.priority.thisWeek" as PortalKey, descKey: "form.priority.thisWeek.desc" as PortalKey, Icon: CalendarIcon, activeColor: "border-primary bg-primary/5" },
  { value: 3, labelKey: "form.priority.urgent" as PortalKey, descKey: "form.priority.urgent.desc" as PortalKey, Icon: FireIcon, activeColor: "border-red-400 bg-red-50" },
];

type RequestType = (typeof requestTypes)[number]["value"];

interface PastRequest {
  title: string;
  type: string;
}

interface NewRequestFormProps {
  clientId: string;
  userId: string;
  clientName?: string;
  isAdmin?: boolean;
  pastRequests?: PastRequest[];
}

const TOTAL_STEPS = 3;

const typeByValue = new Map<string, (typeof requestTypes)[number]>(
  requestTypes.map((rt) => [rt.value, rt])
);

export function NewRequestForm({ clientId, userId, clientName, isAdmin, pastRequests = [] }: NewRequestFormProps) {
  const router = useRouter();
  const { t } = useLocale();
  const [step, setStep] = useState(0);
  const [title, setTitle] = useState("");
  const [type, setType] = useState<RequestType | null>(null);
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState(2);
  const [dueDate, setDueDate] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [direction, setDirection] = useState<"forward" | "back">("forward");

  useEffect(() => {
    if (!submitted) return;
    // Celebration confetti (gated on prefers-reduced-motion)
    fireConfetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
    const timer = setTimeout(() => {
      if (isAdmin) router.back();
      else router.push("/portal");
      router.refresh();
    }, 3500);
    return () => clearTimeout(timer);
  }, [submitted, isAdmin, router]);

  const goNext = useCallback(() => {
    setDirection("forward");
    setStep((s) => Math.min(TOTAL_STEPS - 1, s + 1));
  }, []);

  const goBack = useCallback(() => {
    setDirection("back");
    if (step > 0) setStep((s) => s - 1);
    else router.back();
  }, [step, router]);

  // Step 1: pick a type → jump straight into essentials
  const selectType = useCallback((value: RequestType) => {
    setType(value);
    setDirection("forward");
    setStep(1);
  }, []);

  // Reuse a past brief: prefill type + a versioned title, then to essentials
  const reuseBrief = useCallback((r: PastRequest) => {
    setType((typeByValue.has(r.type) ? r.type : "other") as RequestType);
    setTitle(`${r.title} (v2)`);
    setDirection("forward");
    setStep(1);
  }, []);

  const suggestions = pastRequests.slice(0, 3);

  const addFiles = useCallback((newFiles: File[]) => {
    if (newFiles.length === 0) return;
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
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) addFiles(Array.from(e.target.files));
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const dropped = Array.from(e.dataTransfer.files).filter(
      (f) => f.type.startsWith("image/") || f.type === "application/pdf"
    );
    addFiles(dropped);
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
      toast.error(t("form.error.body"));
      setIsSubmitting(false);
      return;
    }

    if (files.length > 0) {
      let failedUploads = 0;
      await Promise.all(
        files.map(async (file) => {
          const filePath = `${clientId}/${request.id}/${Date.now()}-${file.name}`;
          const { error: uploadError } = await supabase.storage
            .from("references")
            .upload(filePath, file);
          if (uploadError) {
            failedUploads++;
          } else {
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
      if (failedUploads > 0) {
        toast.warning(
          t("form.uploadFailed", { count: failedUploads, s: failedUploads > 1 ? "s" : "" })
        );
      }
    }

    // Notify admin about the new request
    fetch("/api/portal/notify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "request_created",
        request_id: request.id,
        priority,
        description: description.trim() || undefined,
      }),
    }).catch(() => {});

    setIsSubmitting(false);
    setSubmitted(true);
  };

  // Step 0 advances by selecting a type, so it has no primary Continue button.
  const canAdvance = step === 1 ? title.trim().length > 0 : true;
  const isLastStep = step === TOTAL_STEPS - 1;

  return (
    <div className="max-w-lg mx-auto flex flex-col min-h-[calc(100dvh-120px)] pb-20 md:pb-0">
      {submitted ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center animate-in fade-in zoom-in-95 duration-500">
          {/* Animated checkmark circle */}
          <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mb-6">
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none" className="animate-in zoom-in-50 duration-300 delay-200">
              <path d="M12 20L18 26L28 14" stroke="#10b981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h2 className="font-serif italic text-3xl mb-2 text-[color:var(--vimi-ink)]">{t("form.success.title")}</h2>
          <p className="text-[color:var(--vimi-muted)] max-w-xs">
            {t("form.success.body")}
          </p>
        </div>
      ) : (
        <>
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

          {/* Progress — thin 4px segment bars (prototype), one per step */}
          <div className="flex items-center gap-1.5 mb-8">
            {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
              <span
                key={i}
                className={`h-1 flex-1 rounded-full transition-colors duration-500 ease-out ${
                  i <= step ? "bg-primary" : "bg-[color:rgba(28,27,31,0.1)]"
                }`}
              />
            ))}
            <span className="ml-2 shrink-0 text-xs font-semibold text-[color:var(--vimi-faint)]">
              {step + 1} / {TOTAL_STEPS}
            </span>
          </div>

          {/* Step content */}
          <div className={`flex-1 ${direction === "forward" ? "animate-in fade-in slide-in-from-right-4" : "animate-in fade-in slide-in-from-left-4"} duration-300`} key={step}>

            {/* Step 1 — What do you need? (type first) */}
            {step === 0 && (
              <div className="space-y-4">
                <h2 className="font-serif italic text-3xl leading-tight text-[color:var(--vimi-ink)]">
                  {t("form.type.title")}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {t("form.type.subtitle")}
                </p>

                {/* Based on your history — reuse a past brief (Jakob's Law) */}
                {suggestions.length > 0 && (
                  <div className="space-y-2 pt-1">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--vimi-faint)]">
                      {t("form.history.heading")}
                    </p>
                    {suggestions.map((r, i) => {
                      const rt = typeByValue.get(r.type) ?? typeByValue.get("other")!;
                      return (
                        <button
                          key={i}
                          onClick={() => reuseBrief(r)}
                          className="w-full flex items-center gap-3 p-3.5 rounded-xl border border-gray-200 hover:border-primary bg-white transition-all active:scale-[0.98] touch-manipulation text-left"
                        >
                          <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 bg-gray-100 text-muted-foreground">
                            <rt.Icon size={18} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-semibold text-foreground truncate">{r.title}</div>
                            <div className="text-xs text-muted-foreground">{t(rt.labelKey)}</div>
                          </div>
                          <span className="flex items-center gap-1 text-xs font-semibold text-primary shrink-0">
                            {t("form.history.reuse")}
                            <ArrowRight01Icon size={13} />
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {suggestions.length > 0 && (
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--vimi-faint)] pt-1">
                    {t("form.type.startFresh")}
                  </p>
                )}

                <div className="grid grid-cols-2 gap-2">
                  {requestTypes.map((rt) => {
                    const selected = type === rt.value;
                    return (
                      <button
                        key={rt.value}
                        onClick={() => selectType(rt.value)}
                        className={`flex flex-col gap-2 p-4 rounded-xl border transition-all active:scale-[0.98] touch-manipulation text-left ${
                          selected
                            ? "border-primary bg-primary/5 shadow-sm"
                            : "border-gray-200 hover:border-gray-300 bg-white"
                        }`}
                      >
                        <div
                          className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                            selected ? "bg-primary/10 text-primary" : "bg-gray-100 text-muted-foreground"
                          }`}
                        >
                          <rt.Icon size={18} />
                        </div>
                        <div className="min-w-0">
                          <div className={`text-sm font-semibold ${selected ? "text-primary" : "text-foreground"}`}>
                            {t(rt.labelKey)}
                          </div>
                          <div className="text-xs text-muted-foreground leading-snug">{t(rt.descKey)}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Step 2 — Essentials (title + brief + timeline + references) */}
            {step === 1 && (
              <div className="space-y-6">
                <div>
                  <h2 className="font-serif italic text-3xl leading-tight text-[color:var(--vimi-ink)]">
                    {t("form.essentials.title")}
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    {t("form.essentials.subtitle")}
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--vimi-faint)]">
                    {t("form.essentials.titleLabel")}
                  </label>
                  <Input
                    placeholder={t("form.name.placeholder")}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="h-12 text-base"
                    autoFocus
                    onKeyDown={(e) => e.key === "Enter" && canAdvance && goNext()}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--vimi-faint)]">
                    {t("form.essentials.briefLabel")}
                  </label>
                  <Textarea
                    placeholder={t(
                      (type && ["logo", "social", "web", "brand", "presentation"].includes(type)
                        ? `form.details.placeholder.${type}`
                        : "form.details.placeholder") as PortalKey
                    )}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="min-h-[120px] resize-none text-base"
                    onPaste={(e) => {
                      const items = e.clipboardData?.items;
                      if (!items) return;
                      const pasted = Array.from(items)
                        .filter((item) => item.type.startsWith("image/"))
                        .map((item) => item.getAsFile())
                        .filter((f): f is File => f !== null);
                      addFiles(pasted);
                    }}
                  />

                  {/* Inline references — paste, drag, or upload files alongside the brief */}
                  {files.length > 0 && (
                    <div className="grid grid-cols-[repeat(auto-fill,minmax(72px,1fr))] gap-2.5">
                      {files.map((file, i) => (
                        <div key={i} className="flex flex-col gap-1 min-w-0">
                          <div className="relative aspect-square rounded-xl overflow-hidden bg-gray-100 border border-[color:var(--vimi-border)]">
                            {previews[i] ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={previews[i]} alt={file.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex flex-col items-center justify-center gap-1 text-muted-foreground">
                                <Task01Icon size={22} />
                                <span className="text-[9px] font-semibold uppercase tracking-wide">
                                  {file.name.split(".").pop()?.slice(0, 4)}
                                </span>
                              </div>
                            )}
                            <button
                              type="button"
                              onClick={() => removeFile(i)}
                              aria-label={`Remove ${file.name}`}
                              className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/65 hover:bg-black/80 text-white flex items-center justify-center transition-colors"
                            >
                              <Cancel01Icon size={12} />
                            </button>
                          </div>
                          <span className="text-[10px] text-muted-foreground truncate leading-tight">
                            {file.name}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  <label
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDragging(true);
                    }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                    className={`flex flex-col items-center justify-center gap-1.5 rounded-[14px] border-[1.5px] border-dashed cursor-pointer text-center transition-colors ${
                      files.length > 0 ? "px-4 py-3" : "px-4 py-6"
                    } ${
                      isDragging
                        ? "border-primary bg-primary/5"
                        : "border-[color:rgba(28,27,31,0.12)] hover:border-primary"
                    }`}
                  >
                    <PlusSignIcon
                      size={files.length > 0 ? 16 : 20}
                      className={isDragging ? "text-primary" : "text-muted-foreground"}
                    />
                    <span className="text-xs text-muted-foreground leading-snug">
                      {files.length > 0 ? t("form.inspiration.addFile") : t("form.inspiration.dropzone")}
                    </span>
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      multiple
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--vimi-faint)]">
                    {t("form.essentials.timelineLabel")}
                  </label>
                  <div className="space-y-2">
                    {priorities.map((p) => {
                      const selected = priority === p.value;
                      return (
                        <button
                          key={p.value}
                          onClick={() => setPriority(p.value)}
                          className={`w-full flex items-center gap-4 p-3.5 rounded-xl border transition-all active:scale-[0.98] touch-manipulation text-left ${
                            selected ? p.activeColor + " shadow-sm" : "border-gray-200 hover:border-gray-300 bg-white"
                          }`}
                        >
                          <div
                            className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                              selected ? "bg-white/60" : "bg-gray-100"
                            } text-muted-foreground`}
                          >
                            <p.Icon size={18} />
                          </div>
                          <div className="flex-1">
                            <div className="text-sm font-medium">{t(p.labelKey)}</div>
                            <div className="text-xs text-muted-foreground">{t(p.descKey)}</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground">
                    {t("form.timeline.dueDate")} <span className="opacity-60">({t("form.timeline.optional")})</span>
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

            {/* Step 3 — Looks right? (review summary) */}
            {step === 2 && (
              <div className="space-y-4">
                <h2 className="font-serif italic text-3xl leading-tight text-[color:var(--vimi-ink)]">
                  {t("form.review.title")}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {t("form.review.subtitle")}
                </p>
                <div className="rounded-2xl border border-[color:var(--vimi-border)] bg-[color:rgba(28,27,31,0.02)] p-5 flex flex-col gap-3.5">
                  <div className="flex justify-between gap-4">
                    <span className="text-[13px] text-[color:var(--vimi-faint)]">{t("form.summary.request")}</span>
                    <span className="text-[13px] font-bold text-right text-[color:var(--vimi-ink)]">{title.trim() || t("form.summary.untitled")}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-[13px] text-[color:var(--vimi-faint)]">{t("form.summary.type")}</span>
                    <span className="text-[13px] font-semibold text-[color:var(--vimi-ink)]">
                      {type ? t(requestTypes.find((rt) => rt.value === type)!.labelKey) : "—"}
                    </span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-[13px] text-[color:var(--vimi-faint)]">{t("form.summary.priority")}</span>
                    <span className="text-[13px] font-semibold text-[color:var(--vimi-ink)]">
                      {t(priorities.find((p) => p.value === priority)!.labelKey)}
                    </span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-[13px] text-[color:var(--vimi-faint)]">{t("form.timeline.dueDate")}</span>
                    <span className="text-[13px] font-semibold text-[color:var(--vimi-ink)]">{dueDate || "—"}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Bottom bar: Back + primary — hidden on step 1 (type selection advances) */}
          {step > 0 && (
            <div className="fixed bottom-14 left-0 right-0 bg-[var(--vimi-page)]/95 backdrop-blur-sm border-t px-4 py-3 z-30 md:static md:border-t-0 md:px-0 md:py-0 md:bg-transparent md:backdrop-blur-none md:mt-auto md:pt-6 md:pb-2">
              <div className="max-w-lg mx-auto md:max-w-none">
                {!canAdvance && !isSubmitting && (
                  <p className="text-xs text-muted-foreground mb-2 text-center md:text-left">
                    {t("form.essentials.needTitle")}
                  </p>
                )}
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    onClick={goBack}
                    className="h-12 px-6 rounded-xl gap-2 text-muted-foreground"
                  >
                    <ArrowLeft01Icon size={16} />
                    {t("form.back")}
                  </Button>

                  <Button
                    onClick={isLastStep ? handleSubmit : goNext}
                    disabled={!canAdvance || isSubmitting}
                    className={`flex-1 h-14 md:h-12 font-semibold md:font-medium text-base md:text-sm rounded-xl gap-2 disabled:opacity-100 disabled:bg-[color:rgba(28,27,31,0.06)] disabled:text-[#9A96A3] disabled:shadow-none ${
                      isLastStep
                        ? "bg-primary hover:bg-primary/90 text-white shadow-[0_10px_24px_rgba(28,27,31,0.14)]"
                        : "bg-[color:var(--vimi-ink)] hover:bg-[color:var(--vimi-ink)]/90 text-[color:var(--vimi-page)]"
                    }`}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        {t("form.submitting")}
                      </>
                    ) : isLastStep ? (
                      t("form.submit")
                    ) : (
                      <>
                        {t("form.reviewAndSend")}
                        <ArrowRight01Icon size={16} />
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
