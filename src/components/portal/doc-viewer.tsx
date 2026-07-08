"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Download01Icon } from "@/components/ui/icons";
import { useLocale } from "./locale-provider";
import { isPreviewablePdf, isPreviewableImage } from "@/lib/agreement";
import type { HubDoc } from "./agreement-view";

/**
 * Document preview modal. PDFs render in a native <iframe> (desktop) and images
 * as <img>. iOS Safari only renders page 1 of a PDF inside an iframe, so on iOS
 * (and any non-previewable mime) we show an open-in-tab + download fallback.
 */
export function DocViewer({
  doc,
  open,
  onOpenChange,
}: {
  doc: HubDoc | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useLocale();
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    const ua = navigator.userAgent;
    setIsIOS(
      /iPad|iPhone|iPod/.test(ua) ||
        (ua.includes("Mac") && "ontouchend" in document)
    );
  }, []);

  if (!doc) return null;

  const url = doc.signedUrl;
  const showPdf = url && isPreviewablePdf(doc.mime_type) && !isIOS;
  const showImage = url && isPreviewableImage(doc.mime_type);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[860px] w-[calc(100%-32px)] max-h-[90vh] p-0 gap-0 overflow-hidden flex flex-col">
        {/* pr-12 leaves room for the built-in close button (top-right) */}
        <div className="flex items-center gap-3 px-5 py-4 pr-12 border-b border-[color:var(--vimi-border)]">
          <DialogTitle className="text-[15px] font-bold flex-1 truncate text-[color:var(--vimi-ink)]">
            {doc.title}
          </DialogTitle>
          {url && (
            <a
              href={url}
              download={doc.file_name ?? undefined}
              className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-[color:var(--vimi-muted)] hover:text-[color:var(--vimi-ink)] transition-colors shrink-0"
            >
              <Download01Icon size={15} />
              {t("agreement.download")}
            </a>
          )}
        </div>

        <div className="flex-1 min-h-[60vh] flex items-center justify-center bg-[#F6F3EC]">
          {showPdf ? (
            <iframe
              src={url}
              title={doc.title}
              className="w-full h-full min-h-[60vh] border-0"
            />
          ) : showImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={url}
              alt={doc.title}
              className="max-w-full max-h-[80vh] object-contain"
            />
          ) : (
            <div className="flex flex-col items-center gap-4 p-8 text-center">
              <p className="text-[13.5px] text-[color:var(--vimi-muted)] max-w-sm">
                {t("agreement.previewFallback")}
              </p>
              {url && (
                <div className="flex flex-wrap items-center justify-center gap-2.5">
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-full px-4 py-2.5 text-[13px] font-semibold text-white"
                    style={{ background: "var(--accent)" }}
                  >
                    {t("agreement.openNewTab")}
                  </a>
                  <a
                    href={url}
                    download={doc.file_name ?? undefined}
                    className="inline-flex items-center gap-1.5 rounded-full border border-[color:var(--vimi-border)] bg-white px-4 py-2.5 text-[13px] font-semibold text-[color:var(--vimi-ink)]"
                  >
                    <Download01Icon size={15} />
                    {t("agreement.download")}
                  </a>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
