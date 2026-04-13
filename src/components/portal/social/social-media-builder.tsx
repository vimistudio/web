"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft01Icon } from "@/components/ui/icons";
import { toast } from "sonner";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { InstagramCarouselPreview } from "./instagram-carousel-preview";
import { SlideStrip } from "./slide-strip";
import { SlideUploadZone } from "./slide-upload-zone";
import { PostMetadataForm } from "./post-metadata-form";
import { PublishDialog } from "./publish-dialog";
import { normalizeInstagramImage } from "@/lib/normalize-instagram-image";

interface Slide {
  id: string;
  slide_order: number;
  image_path: string | null;
  url: string | null;
  alt_text: string | null;
}

interface SocialMediaBuilderProps {
  postId: string;
  requestId: string;
  clientName: string;
  clientSlug: string;
  initialPost: {
    ig_handle: string | null;
    ig_caption: string | null;
    status: string;
  };
  initialSlides: Slide[];
}

export function SocialMediaBuilder({
  postId,
  requestId,
  clientName,
  clientSlug,
  initialPost,
  initialSlides,
}: SocialMediaBuilderProps) {
  const router = useRouter();
  const [slides, setSlides] = useState<Slide[]>(initialSlides);
  const [activeSlideId, setActiveSlideId] = useState<string | null>(
    initialSlides[0]?.id || null
  );
  const [handle, setHandle] = useState(initialPost.ig_handle || "@");
  const [caption, setCaption] = useState(initialPost.ig_caption || "");
  const [isUploading, setIsUploading] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const isPublished = initialPost.status === "published";

  // Auto-save metadata on change (debounced)
  useEffect(() => {
    if (isPublished) return;
    const timeout = setTimeout(() => {
      fetch(`/api/portal/social-posts/${postId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ig_handle: handle, ig_caption: caption }),
      });
    }, 1000);
    return () => clearTimeout(timeout);
  }, [handle, caption, postId, isPublished]);

  const addSlide = useCallback(async () => {
    const res = await fetch(`/api/portal/social-posts/${postId}/slides`, {
      method: "POST",
    });
    const newSlide = await res.json();
    if (res.ok) {
      setSlides((prev) => [...prev, { ...newSlide, url: null }]);
      setActiveSlideId(newSlide.id);
    }
  }, [postId]);

  const deleteSlide = useCallback(
    async (slideId: string) => {
      const slide = slides.find((s) => s.id === slideId);
      if (!slide) return;

      const res = await fetch(
        `/api/portal/social-posts/${postId}/slides/${slideId}/image`,
        { method: "DELETE" }
      );
      if (res.ok) {
        setSlides((prev) => prev.filter((s) => s.id !== slideId));
        if (activeSlideId === slideId) {
          setActiveSlideId(slides[0]?.id || null);
        }
        toast.success("Slide removed");
      }
    },
    [postId, slides, activeSlideId]
  );

  const handleReorder = useCallback(
    async (reordered: Slide[]) => {
      setSlides(reordered);
      await fetch(`/api/portal/social-posts/${postId}/slides`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slides: reordered.map((s) => ({ id: s.id, slide_order: s.slide_order })),
        }),
      });
    },
    [postId]
  );

  // Upload file directly to Supabase Storage (bypasses Vercel 4.5MB limit),
  // then PATCH the slide record with the storage path
  const uploadFileToSlide = useCallback(
    async (slideId: string, file: File): Promise<{ image_path: string; url: string } | null> => {
      const supabase = createClient();
      const timestamp = Date.now();
      const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_") || `paste-${timestamp}.png`;
      const storagePath = `uploads/${postId}/${timestamp}-${safeName}`;

      const { error: uploadError } = await supabase.storage
        .from("social-slides")
        .upload(storagePath, file, { contentType: file.type, upsert: false });

      if (uploadError) {
        console.error("Storage upload failed:", uploadError);
        return null;
      }

      // Tell the API to update the slide record
      const res = await fetch(
        `/api/portal/social-posts/${postId}/slides/${slideId}/image`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image_path: storagePath }),
        }
      );
      if (!res.ok) return null;
      return res.json();
    },
    [postId]
  );

  const handleFilesSelected = useCallback(
    async (files: File[]) => {
      setIsUploading(true);
      try {
        // Normalize each file to Instagram's 1080×1350 (4:5) spec BEFORE upload.
        // What gets stored is exactly what shows in the carousel preview and on IG —
        // no display-time crop surprises.
        let croppedCount = 0;
        const normalizedFiles: File[] = [];
        for (const f of files) {
          try {
            const result = await normalizeInstagramImage(f);
            normalizedFiles.push(result.file);
            if (result.modified) croppedCount += 1;
          } catch (err) {
            console.error("Normalize failed for", f.name, err);
            normalizedFiles.push(f); // fall back to original
          }
        }
        if (croppedCount > 0) {
          toast.info(
            `${croppedCount} image${croppedCount > 1 ? "s" : ""} center-cropped to Instagram's 4:5 portrait spec`
          );
        }

        for (const file of normalizedFiles) {
          // Create a slide first
          const slideRes = await fetch(
            `/api/portal/social-posts/${postId}/slides`,
            { method: "POST" }
          );
          const newSlide = await slideRes.json();
          if (!slideRes.ok) continue;

          // Upload directly to Supabase Storage
          const uploaded = await uploadFileToSlide(newSlide.id, file);

          if (uploaded) {
            setSlides((prev) => [
              ...prev,
              { ...newSlide, image_path: uploaded.image_path, url: uploaded.url, alt_text: null },
            ]);
            setActiveSlideId(newSlide.id);
          }
        }
        toast.success(`${files.length} slide${files.length > 1 ? "s" : ""} added`);
      } catch {
        toast.error("Upload failed");
      } finally {
        setIsUploading(false);
      }
    },
    [postId, uploadFileToSlide]
  );

  // Paste images from clipboard (Cmd+V / Ctrl+V)
  useEffect(() => {
    if (isPublished) return;
    const handlePaste = (e: ClipboardEvent) => {
      // Don't intercept paste when typing in an input/textarea
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;

      const items = e.clipboardData?.items;
      if (!items) return;
      const imageFiles: File[] = [];
      for (const item of Array.from(items)) {
        if (item.type.startsWith("image/")) {
          const file = item.getAsFile();
          if (file) imageFiles.push(file);
        }
      }
      if (imageFiles.length > 0) {
        e.preventDefault();
        handleFilesSelected(imageFiles);
      }
    };
    document.addEventListener("paste", handlePaste);
    return () => document.removeEventListener("paste", handlePaste);
  }, [isPublished, handleFilesSelected]);

  const handleUploadToExistingSlide = useCallback(
    async (slideId: string, file: File) => {
      setIsUploading(true);
      try {
        let normalizedFile = file;
        try {
          const result = await normalizeInstagramImage(file);
          normalizedFile = result.file;
          if (result.modified) {
            toast.info("Image center-cropped to Instagram's 4:5 portrait spec");
          }
        } catch (err) {
          console.error("Normalize failed", err);
        }
        const uploaded = await uploadFileToSlide(slideId, normalizedFile);
        if (uploaded) {
          setSlides((prev) =>
            prev.map((s) =>
              s.id === slideId
                ? { ...s, image_path: uploaded.image_path, url: uploaded.url }
                : s
            )
          );
          toast.success("Slide image updated");
        } else {
          toast.error("Upload failed");
        }
      } catch {
        toast.error("Upload failed");
      } finally {
        setIsUploading(false);
      }
    },
    [uploadFileToSlide]
  );

  const handlePublish = useCallback(async () => {
    setIsPublishing(true);
    try {
      // Save metadata first
      await fetch(`/api/portal/social-posts/${postId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ig_handle: handle, ig_caption: caption }),
      });

      const res = await fetch(`/api/portal/social-posts/${postId}/publish`, {
        method: "POST",
      });

      if (res.ok) {
        toast.success("Carousel published to client!");
        router.push(`/portal/admin/clients/${clientSlug}`);
      } else {
        const err = await res.json();
        toast.error(err.error || "Publish failed");
      }
    } catch {
      toast.error("Publish failed");
    } finally {
      setIsPublishing(false);
    }
  }, [postId, handle, caption, clientSlug, router]);

  const slidesWithImages = slides.filter((s) => s.url);
  const previewSlides = slidesWithImages.map((s) => ({
    url: s.url!,
    alt: s.alt_text || undefined,
  }));

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <div className="bg-white border-b px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href={`/portal/admin/clients/${clientSlug}`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft01Icon className="w-4 h-4 mr-1" />
              Back
            </Button>
          </Link>
          <div className="h-5 w-px bg-gray-200" />
          <span className="text-sm font-medium text-gray-900">
            Carousel Builder
          </span>
          <Badge
            variant={isPublished ? "default" : "secondary"}
            className="text-xs"
          >
            {isPublished ? "Published" : "Draft"}
          </Badge>
        </div>
        <span className="text-sm text-gray-500">{clientName}</span>
      </div>

      {/* Mobile guard */}
      <div className="lg:hidden flex items-center justify-center min-h-[60vh] px-6">
        <div className="text-center">
          <p className="text-gray-500 text-sm">
            The carousel builder requires a desktop screen.
          </p>
          <Link href={`/portal/admin/clients/${clientSlug}`}>
            <Button variant="outline" size="sm" className="mt-4">
              Back to Board
            </Button>
          </Link>
        </div>
      </div>

      {/* Desktop two-column layout */}
      <div className="hidden lg:flex max-w-7xl mx-auto p-6 gap-8">
        {/* Left: Preview + Slide Strip */}
        <div className="flex-1 flex flex-col items-center">
          {previewSlides.length > 0 ? (
            <InstagramCarouselPreview
              slides={previewSlides}
              handle={handle || "@handle"}
              caption={caption}
              subtitle="Instagram Carousel"
            />
          ) : (
            <div
              className="bg-white rounded-xl shadow-2xl flex items-center justify-center text-gray-400 text-sm"
              style={{
                width: "min(390px, 100%)",
                aspectRatio: "4 / 6.2",
              }}
            >
              Upload slides to preview
            </div>
          )}

          {/* Slide strip below preview */}
          <div className="w-full max-w-[390px] mt-4 bg-white rounded-lg border p-2">
            <SlideStrip
              slides={slides}
              activeSlideId={activeSlideId}
              onSelect={setActiveSlideId}
              onReorder={handleReorder}
              onAdd={addSlide}
              onDelete={deleteSlide}
            />
          </div>
        </div>

        {/* Right: Controls */}
        <div className="w-[380px] flex-shrink-0 space-y-6">
          {/* Upload zone */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">
              Add Slides
            </h3>
            <SlideUploadZone
              onFilesSelected={handleFilesSelected}
              isUploading={isUploading}
            />
          </div>

          {/* Replace active slide image */}
          {activeSlideId && (
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-2">
                Replace Slide Image
              </h3>
              <label className="block">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleUploadToExistingSlide(activeSlideId, file);
                    e.target.value = "";
                  }}
                />
                <span className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700 cursor-pointer">
                  Choose new image for selected slide
                </span>
              </label>
            </div>
          )}

          {/* Metadata form */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">
              Post Details
            </h3>
            <PostMetadataForm
              handle={handle}
              caption={caption}
              onHandleChange={setHandle}
              onCaptionChange={setCaption}
            />
          </div>

          {/* Publish */}
          {!isPublished && (
            <div className="pt-4 border-t">
              <PublishDialog
                clientName={clientName}
                slideCount={slidesWithImages.length}
                onPublish={handlePublish}
                isPublishing={isPublishing}
                disabled={slidesWithImages.length === 0}
              />
              <p className="text-xs text-gray-400 text-center mt-2">
                {slidesWithImages.length} slide{slidesWithImages.length !== 1 ? "s" : ""} ready
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
