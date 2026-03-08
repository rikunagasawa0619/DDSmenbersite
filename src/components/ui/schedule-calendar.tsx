import Link from "next/link";
import { addDays, endOfMonth, endOfWeek, isSameMonth, startOfMonth, startOfWeek } from "date-fns";
import { formatInTimeZone, fromZonedTime } from "date-fns-tz";

import { appTimeZone } from "@/lib/datetime";
import { cn } from "@/lib/utils";

type ScheduleCalendarEntry = {
  id: string;
  title: string;
  startsAt: string;
  href?: string;
  badge?: string;
};

function formatMonthLabel(date: Date) {
  return formatInTimeZone(date, appTimeZone, "yyyy年M月");
}

function getDayKey(date: Date | string) {
  return formatInTimeZone(date, appTimeZone, "yyyy-MM-dd");
}

export function getCalendarMonth(monthParam?: string) {
  if (monthParam && /^\d{4}-\d{2}$/.test(monthParam)) {
    return fromZonedTime(`${monthParam}-01T00:00:00`, appTimeZone);
  }

  const nowKey = formatInTimeZone(new Date(), appTimeZone, "yyyy-MM");
  return fromZonedTime(`${nowKey}-01T00:00:00`, appTimeZone);
}

export function shiftCalendarMonth(date: Date, deltaMonths: number) {
  const year = Number(formatInTimeZone(date, appTimeZone, "yyyy"));
  const month = Number(formatInTimeZone(date, appTimeZone, "MM"));
  const jsDate = new Date(Date.UTC(year, month - 1 + deltaMonths, 1));
  return formatInTimeZone(jsDate, appTimeZone, "yyyy-MM");
}

export function ScheduleCalendar({
  month,
  entries,
  emptyLabel = "予定はありません",
  dayHrefBuilder,
}: {
  month: Date;
  entries: ScheduleCalendarEntry[];
  emptyLabel?: string;
  dayHrefBuilder?: (dayKey: string) => string | undefined;
}) {
  const monthStart = startOfMonth(month);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const gridEnd = endOfWeek(endOfMonth(month), { weekStartsOn: 0 });
  const entryMap = entries.reduce<Record<string, ScheduleCalendarEntry[]>>((acc, entry) => {
    const key = getDayKey(entry.startsAt);
    acc[key] ??= [];
    acc[key].push(entry);
    return acc;
  }, {});

  const days: Date[] = [];
  let cursor = gridStart;
  while (cursor <= gridEnd) {
    days.push(cursor);
    cursor = addDays(cursor, 1);
  }

  return (
    <div className="overflow-hidden rounded-[28px] border border-black/8 bg-white">
      <div className="grid grid-cols-7 border-b border-black/6 bg-black/[0.03]">
        {["日", "月", "火", "水", "木", "金", "土"].map((day) => (
          <div key={day} className="px-3 py-3 text-center text-xs font-semibold tracking-[0.18em] text-slate-500">
            {day}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days.map((day) => {
          const key = getDayKey(day);
          const dayEntries = entryMap[key] ?? [];
          return (
            <div
              key={key}
              className={cn(
                "group relative min-h-36 border-b border-r border-black/6 p-3 align-top",
                !isSameMonth(day, month) && "bg-black/[0.015] text-slate-400",
              )}
            >
              <div className="text-sm font-semibold">{formatInTimeZone(day, appTimeZone, "d")}</div>
              <div className="mt-3 space-y-2">
                {dayEntries.length === 0 ? (
                  dayHrefBuilder ? (
                    <Link
                      href={dayHrefBuilder(key) ?? "#"}
                      aria-label={`${key} に予定を作成`}
                      className="block min-h-24 rounded-2xl border border-transparent px-3 py-4 text-[11px] leading-5 text-transparent transition group-hover:border-black/6 hover:border-[var(--color-primary)]/20 hover:bg-[var(--color-primary)]/4"
                    >
                      {emptyLabel}
                    </Link>
                  ) : (
                    <div className="rounded-2xl border border-dashed border-black/8 px-2 py-3 text-[11px] leading-5 text-slate-400">
                      {emptyLabel}
                    </div>
                  )
                ) : (
                  dayEntries.map((entry) =>
                    entry.href ? (
                      <Link
                        key={entry.id}
                        href={entry.href}
                        className="block rounded-2xl border border-[var(--color-primary)]/12 bg-[var(--color-primary)]/6 px-3 py-2 text-xs leading-5 text-slate-700 transition hover:border-[var(--color-primary)]/25 hover:bg-[var(--color-primary)]/10"
                      >
                        <div className="font-semibold text-[var(--color-primary)]">
                          {formatInTimeZone(entry.startsAt, appTimeZone, "HH:mm")}
                        </div>
                        <div className="mt-1 font-medium text-slate-900">{entry.title}</div>
                        {entry.badge ? (
                          <div className="mt-1 text-[10px] font-semibold tracking-[0.12em] text-slate-500">
                            {entry.badge}
                          </div>
                        ) : null}
                      </Link>
                    ) : (
                      <div
                        key={entry.id}
                        className="rounded-2xl border border-[var(--color-primary)]/12 bg-[var(--color-primary)]/6 px-3 py-2 text-xs leading-5 text-slate-700"
                      >
                        <div className="font-semibold text-[var(--color-primary)]">
                          {formatInTimeZone(entry.startsAt, appTimeZone, "HH:mm")}
                        </div>
                        <div className="mt-1 font-medium text-slate-900">{entry.title}</div>
                        {entry.badge ? (
                          <div className="mt-1 text-[10px] font-semibold tracking-[0.12em] text-slate-500">
                            {entry.badge}
                          </div>
                        ) : null}
                      </div>
                    ),
                  )
                )}
              </div>
            </div>
          );
        })}
      </div>
      <div className="border-t border-black/6 bg-black/[0.02] px-4 py-3 text-sm font-semibold text-slate-500">
        {formatMonthLabel(month)}
      </div>
    </div>
  );
}
