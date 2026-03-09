"use client";

import { useFormStatus } from "react-dom";

export function SubmitButton({
  children,
  pendingLabel = "保存中...",
  className = "",
  disabled = false,
  confirmMessage,
}: {
  children: React.ReactNode;
  pendingLabel?: string;
  className?: string;
  disabled?: boolean;
  confirmMessage?: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      onClick={(event) => {
        if (confirmMessage && !window.confirm(confirmMessage)) {
          event.preventDefault();
        }
      }}
      className={`inline-flex items-center justify-center rounded-full bg-[var(--color-primary)] px-4 py-2 font-display text-xs font-extrabold uppercase tracking-[0.16em] text-white transition hover:translate-y-[-1px] hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
      disabled={pending || disabled}
    >
      {pending ? pendingLabel : children}
    </button>
  );
}
