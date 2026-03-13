"use client";

import { useMemo, useState } from "react";

import { Card } from "@/components/ui/card";
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

export function BookingsCalendarPanel({
  initialMonth,
  entries,
}: {
  initialMonth: string;
  entries: CalendarEntry[];
}) {
  const [monthKey, setMonthKey] = useState(initialMonth);
  const month = useMemo(() => getCalendarMonth(monthKey), [monthKey]);

  return (
    <Card className="dds-reveal overflow-hidden" data-delay="1">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-sm font-semibold text-slate-500">予約カレンダー</div>
          <h2 className="mt-3 font-display text-3xl font-extrabold tracking-[-0.08em] text-slate-950">
            月ごとの予約枠を視覚的に確認
          </h2>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setMonthKey(shiftCalendarMonth(month, -1))}
            className="inline-flex rounded-full border border-black/10 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
          >
            前月
          </button>
          <button
            type="button"
            onClick={() => setMonthKey(shiftCalendarMonth(month, 1))}
            className="inline-flex rounded-full border border-black/10 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
          >
            次月
          </button>
        </div>
      </div>
      <p className="mt-4 text-sm leading-7 text-slate-600">
        カレンダー内のカードを押すと、該当する予約枠の詳細に移動します。満席時は待機申込に切り替わります。
      </p>
      <div className="mt-6">
        <ScheduleCalendar month={month} entries={entries} emptyLabel="予定なし" />
      </div>
    </Card>
  );
}
