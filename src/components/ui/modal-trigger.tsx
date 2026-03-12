"use client";

import { useState } from "react";

import { Modal } from "@/components/ui/modal";
import { cn } from "@/lib/utils";

export function ModalTrigger({
  title,
  description,
  size = "lg",
  triggerClassName,
  triggerContent,
  children,
}: {
  title: string;
  description?: string;
  size?: "md" | "lg" | "xl";
  triggerClassName?: string;
  triggerContent: React.ReactNode;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className={cn("transition", triggerClassName)}
        onClick={() => setOpen(true)}
      >
        {triggerContent}
      </button>

      {open ? (
        <Modal
          title={title}
          description={description}
          size={size}
          onClose={() => setOpen(false)}
        >
          {children}
        </Modal>
      ) : null}
    </>
  );
}
