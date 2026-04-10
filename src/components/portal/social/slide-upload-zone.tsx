"use client";

import { useRef, useState, useCallback } from "react";
import { Upload01Icon } from "@/components/ui/icons";
import { Button } from "@/components/ui/button";

interface SlideUploadZoneProps {
  onFilesSelected: (files: File[]) => void;
  isUploading: boolean;
}

export function SlideUploadZone({ onFilesSelected, isUploading }: SlideUploadZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files) return;
      const imageFiles = Array.from(files).filter((f) =>
        f.type.startsWith("image/")
      );
      if (imageFiles.length > 0) {
        onFilesSelected(imageFiles);
      }
    },
    [onFilesSelected]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragOver(true);
      }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={handleDrop}
      className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors ${
        isDragOver
          ? "border-blue-400 bg-blue-50"
          : "border-gray-200 hover:border-gray-300"
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
      <Upload01Icon className="w-8 h-8 text-gray-400 mx-auto mb-3" />
      <p className="text-sm text-gray-500 mb-3">
        Drag slide images here or click to upload
      </p>
      <Button
        variant="outline"
        size="sm"
        onClick={() => inputRef.current?.click()}
        disabled={isUploading}
      >
        {isUploading ? "Uploading..." : "Choose Files"}
      </Button>
      <p className="text-xs text-gray-400 mt-2">
        PNG, JPG up to 10MB · 1080×1350 recommended · or paste (⌘V)
      </p>
    </div>
  );
}
