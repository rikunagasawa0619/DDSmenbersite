"use client";

import { useCallback, useEffect, useId, useRef } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";

const focusableSelector = [
  "a[href]",
  "button:not([disabled])",
  "textarea:not([disabled])",
  "input:not([disabled]):not([type='hidden'])",
  "select:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

function getFocusableElements(container: HTMLElement) {
  return Array.from(container.querySelectorAll<HTMLElement>(focusableSelector)).filter(
    (element) =>
      !element.hasAttribute("disabled") &&
      element.getAttribute("aria-hidden") !== "true" &&
      !(element instanceof HTMLInputElement && element.type === "hidden"),
  );
}

export function Modal({
  title,
  description,
  closeHref,
  onClose,
  size = "lg",
  children,
}: {
  title: string;
  description?: string;
  closeHref?: string;
  onClose?: () => void;
  size?: "md" | "lg" | "xl";
  children: React.ReactNode;
}) {
  const router = useRouter();
  const titleId = useId();
  const descriptionId = useId();
  const panelRef = useRef<HTMLDivElement>(null);

  const closeModal = useCallback(() => {
    if (onClose) {
      onClose();
      return;
    }

    if (closeHref) {
      router.push(closeHref, { scroll: false });
    }
  }, [closeHref, onClose, router]);

  useEffect(() => {
    const panel = panelRef.current;
    if (!panel) {
      return;
    }

    const previousActiveElement =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const focusable = getFocusableElements(panel);
    (focusable[0] ?? panel).focus();

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeModal();
        return;
      }

      if (event.key !== "Tab") {
        return;
      }

      const items = getFocusableElements(panel);
      if (items.length === 0) {
        event.preventDefault();
        panel.focus();
        return;
      }

      const first = items[0];
      const last = items[items.length - 1];
      const activeElement = document.activeElement;

      if (event.shiftKey && activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      document.removeEventListener("keydown", onKeyDown);
      previousActiveElement?.focus();
    };
  }, [closeModal]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(7,17,31,0.56)] p-4 backdrop-blur-md"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          closeModal();
        }
      }}
    >
      <div
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        className={cn(
          "relative max-h-[92vh] w-full overflow-hidden rounded-[36px] border border-[var(--color-outline)] shadow-[0_50px_140px_rgba(7,17,31,0.26)] outline-none",
          size === "md" && "max-w-3xl",
          size === "lg" && "max-w-5xl",
          size === "xl" && "max-w-6xl",
        )}
        style={{ background: "var(--color-shell-main)" }}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-[rgba(215,255,100,0.16)] blur-3xl" />
        <div
          className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b px-6 py-5 backdrop-blur md:px-8"
          style={{
            borderColor: "var(--color-outline)",
            background: "color-mix(in srgb, var(--color-surface-raised) 88%, transparent)",
          }}
        >
          <div>
            <div className="dds-kicker text-[var(--color-primary)]">editor</div>
            <h2
              id={titleId}
              className="mt-3 font-display text-3xl font-extrabold tracking-[-0.08em] text-slate-950"
            >
              {title}
            </h2>
            {description ? (
              <p id={descriptionId} className="mt-2 max-w-3xl text-sm leading-7 text-slate-600">
                {description}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={closeModal}
            aria-label="ダイアログを閉じる"
            className="dds-shell-action inline-flex h-11 w-11 items-center justify-center rounded-full transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="max-h-[calc(92vh-118px)] overflow-y-auto px-6 py-6 md:px-8">
          {children}
        </div>
      </div>
    </div>
  );
}
