"use client";

import { useState, useEffect, type ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useParams, useRouter, useSearchParams } from "next/navigation";

export function DialogWrapper(props: { children: ReactNode }) {
  const router = useRouter();
  const params = useSearchParams();
  const { term, course } = useParams();

  const [visible, setVisible] = useState(Boolean(course));

  useEffect(() => {
    if (course) {
      setVisible(true);
    } else {
      setVisible(false);
    }
  }, [course]);

  return (
    <Dialog
      open={visible}
      onOpenChange={() => router.push(`/${term}?${params.toString()}`)}
    >
      <DialogContent className="min-w-[80%] h-[95%] bg-secondary">
        <DialogHeader className="hidden">
          <DialogTitle className="">{course}</DialogTitle>
          {/* <DialogDescription> */}
          {/* </DialogDescription> */}
        </DialogHeader>
        {course && props.children}
      </DialogContent>
    </Dialog>
  );
}
