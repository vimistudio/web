"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

interface PublishDialogProps {
  clientName: string;
  slideCount: number;
  onPublish: () => void;
  isPublishing: boolean;
  disabled: boolean;
}

export function PublishDialog({
  clientName,
  slideCount,
  onPublish,
  isPublishing,
  disabled,
}: PublishDialogProps) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button className="w-full" disabled={disabled || isPublishing}>
          {isPublishing ? "Publishing..." : "Publish to Client"}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Publish carousel?</AlertDialogTitle>
          <AlertDialogDescription>
            This will deliver the {slideCount}-slide carousel to{" "}
            <strong>{clientName}</strong>. It will appear in their gallery and
            board immediately.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onPublish}>
            Publish
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
