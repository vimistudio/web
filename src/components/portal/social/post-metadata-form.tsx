"use client";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface PostMetadataFormProps {
  handle: string;
  caption: string;
  onHandleChange: (value: string) => void;
  onCaptionChange: (value: string) => void;
}

const MAX_CAPTION = 2200;

export function PostMetadataForm({
  handle,
  caption,
  onHandleChange,
  onCaptionChange,
}: PostMetadataFormProps) {
  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="ig-handle" className="text-sm font-medium text-gray-700">
          Instagram Handle
        </Label>
        <div className="relative mt-1.5">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
            @
          </span>
          <Input
            id="ig-handle"
            value={handle.replace("@", "")}
            onChange={(e) => onHandleChange(`@${e.target.value.replace("@", "")}`)}
            placeholder="savemydish_"
            className="pl-8"
          />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between">
          <Label htmlFor="ig-caption" className="text-sm font-medium text-gray-700">
            Caption
          </Label>
          <span
            className={`text-xs ${
              caption.length > MAX_CAPTION ? "text-red-500" : "text-gray-400"
            }`}
          >
            {caption.length}/{MAX_CAPTION}
          </span>
        </div>
        <Textarea
          id="ig-caption"
          value={caption}
          onChange={(e) => onCaptionChange(e.target.value)}
          placeholder="Write your Instagram caption..."
          className="mt-1.5 min-h-[120px] resize-none"
          maxLength={MAX_CAPTION}
        />
      </div>
    </div>
  );
}
