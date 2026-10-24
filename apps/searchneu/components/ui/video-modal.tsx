"use client";
import { X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogClose,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

type VideoModalProps = {
  videoId: string;
  title: string;
  description: string;
  open: boolean;
  onOpenChange: (val: boolean) => void;
};

/**
 * A How-To Video Modal shows a single embedded YouTube video, with a description below it.
 */
function VideoModal({
  videoId,
  title,
  description,
  open,
  onOpenChange,
}: VideoModalProps) {
  const firstWord = title.split(" ")[0];
  const restOfTitle = title.split(" ").slice(1).join(" ");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="bg-neu1 flex flex-col gap-6 rounded-xl p-6 sm:max-w-178"
      >
        <DialogClose className="bg-neu3 text-neu8 absolute top-0 -right-9 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full shadow ring-0 outline-none">
          <X size={20} strokeWidth={2.3} />
        </DialogClose>

        <div className="aspect-video w-full overflow-hidden rounded-lg">
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${videoId}`}
            title={title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            className="h-full w-full"
          />
        </div>

        <div className="flex flex-col gap-3">
          <DialogTitle className="text-r5 text-3xl leading-6 font-semibold">
            {firstWord} <span className="text-neu8">{restOfTitle}</span>
          </DialogTitle>
          <DialogDescription className="text-neu7 text-lg leading-tight">
            {description}
          </DialogDescription>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export { VideoModal };
