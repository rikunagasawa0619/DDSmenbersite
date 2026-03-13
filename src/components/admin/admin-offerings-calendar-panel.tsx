"use client";

import { useMemo, useState } from "react";

import { OfferingEditorForm, getDefaultOfferingStartValue } from "@/components/admin/offering-editor-form";
import { Card } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import {
  getCalendarMonth,
  ScheduleCalendar,
  shiftCalendarMonth,
} from "@/components/ui/schedule-calendar";

type CalendarEntry = {
  id: string;
  title: string;
  startsAt: string;
  href?: string;
  badge?: string;
};

export function AdminOfferingsCalendarPanel({
  initialMonth,
  entries,
  totalOfferings,
  totalReservations,
  totalWaitlist,
}: {
  initialMonth: string;
  entries: CalendarEntry[];
  totalOfferings: number;
  totalReservations: number;
  totalWaitlist: number;
}) {
  const [monthKey, setMonthKey] = useState(initialMonth);
  const [draftStart, setDraftStart] = useState<string | null>(null);
  const month = useMemo(() => getCalendarMonth(monthKey), [monthKey]);

  return (
    <section className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
      <Card className="overflow-hidden">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="dds-kicker text-slate-500">月間カレンダー</div>
            <h2 className="mt-2 font-display text-2xl font-extrabold tracking-[-0.08em] text-slate-950">
              カレンダー
            </h2>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setMonthKey(shiftCalendarMonth(month, -1))}
              className="inline-flex rounded-full border border-black/10 bg-white px-4 py-2 font-display text-xs font-extrabold uppercase tracking-[0.16em] text-slate-700 transition hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
            >
              前月
            </button>
            <button
              type="button"
              onClick={() => setMonthKey(shiftCalendarMonth(month, 1))}
              className="inline-flex rounded-full border border-black/10 bg-white px-4 py-2 font-display text-xs font-extrabold uppercase tracking-[0.16em] text-slate-700 transition hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
            >
              次月
            </button>
            <button
              type="button"
              onClick={() => setDraftStart(getDefaultOfferingStartValue())}
              className="inline-flex rounded-full bg-[var(--color-primary)] px-5 py-3 font-display text-xs font-extrabold uppercase tracking-[0.16em] text-white shadow-[0_18px_40px_rgba(18,56,198,0.22)] transition hover:opacity-90"
            >
              新しい募集枠
            </button>
          </div>
        </div>

        <ScheduleCalendar
          month={month}
          entries={entries}
          emptyLabel="クリックで作成"
          onDaySelect={(dayKey) => setDraftStart(getDefaultOfferingStartValue(dayKey))}
        />
      </Card>

      <Card className="grid gap-4 bg-[linear-gradient(180deg,#edf3ff,#f5efe2)] text-slate-950 md:grid-cols-3">
        <div className="rounded-[24px] border border-black/8 bg-white/72 p-5">
          <div className="text-xs tracking-[0.18em] text-slate-500">総枠数</div>
          <div className="mt-3 font-display text-4xl font-bold">{totalOfferings}</div>
        </div>
        <div className="rounded-[24px] border border-black/8 bg-white/72 p-5">
          <div className="text-xs tracking-[0.18em] text-slate-500">予約数</div>
          <div className="mt-3 font-display text-4xl font-bold">{totalReservations}</div>
        </div>
        <div className="rounded-[24px] border border-black/8 bg-white/72 p-5">
          <div className="text-xs tracking-[0.18em] text-slate-500">待機数</div>
          <div className="mt-3 font-display text-4xl font-bold">{totalWaitlist}</div>
        </div>
      </Card>

      {draftStart ? (
        <Modal
          title="募集枠を作成"
          description="空いている日付を押すと、その日の開始日時を初期値にして開きます。"
          size="xl"
          onClose={() => setDraftStart(null)}
        >
          <OfferingEditorForm defaultStart={draftStart} />
        </Modal>
      ) : null}
    </section>
  );
}
