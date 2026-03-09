import {
  endOfMonth,
  getDaysInMonth,
  setMonth,
  setYear,
  subMonths,
} from "date-fns";
import { formatInTimeZone, fromZonedTime } from "date-fns-tz";

export const appTimeZone = "Asia/Tokyo";

function getZonedNumber(date: Date, token: string) {
  return Number(formatInTimeZone(date, appTimeZone, token));
}

export function formatDateTimeInAppZone(date: string | Date, format = "MMM d HH:mm") {
  return formatInTimeZone(date, appTimeZone, format);
}

export function startOfMonthInAppZone(date: Date) {
  const year = getZonedNumber(date, "yyyy");
  const month = getZonedNumber(date, "MM");
  return fromZonedTime(`${year}-${String(month).padStart(2, "0")}-01T00:00:00`, appTimeZone);
}

export function endOfMonthInAppZone(date: Date) {
  const start = startOfMonthInAppZone(date);
  const zonedMonthEnd = endOfMonth(start);
  const year = getZonedNumber(zonedMonthEnd, "yyyy");
  const month = getZonedNumber(zonedMonthEnd, "MM");
  const day = getZonedNumber(zonedMonthEnd, "dd");
  return fromZonedTime(
    `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}T23:59:59.999`,
    appTimeZone,
  );
}

function getResolvedGrantDay(contractStartAt: string, grantDayOverride?: number) {
  if (grantDayOverride) {
    return Math.min(Math.max(grantDayOverride, 1), 31);
  }

  const contractDate = new Date(contractStartAt);
  return getZonedNumber(contractDate, "dd");
}

function getCycleAnchorDateForDay(
  contractStartAt: string,
  targetYear: number,
  targetMonthIndex: number,
  grantDayOverride?: number,
) {
  const contractDay = getResolvedGrantDay(contractStartAt, grantDayOverride);

  const base = setMonth(setYear(new Date(), targetYear), targetMonthIndex);
  const maxDay = getDaysInMonth(base);
  const safeDay = Math.min(contractDay, maxDay);

  return fromZonedTime(
    `${targetYear}-${String(targetMonthIndex + 1).padStart(2, "0")}-${String(safeDay).padStart(2, "0")}T00:00:00`,
    appTimeZone,
  );
}

export function getContractCycleStart(
  referenceDate: Date,
  contractStartAt: string,
  grantDayOverride?: number,
) {
  const contractDay = getResolvedGrantDay(contractStartAt, grantDayOverride);
  const refYear = getZonedNumber(referenceDate, "yyyy");
  const refMonth = getZonedNumber(referenceDate, "MM") - 1;
  const refDay = getZonedNumber(referenceDate, "dd");

  const startMonthDate =
    refDay >= contractDay
      ? getCycleAnchorDateForDay(contractStartAt, refYear, refMonth, grantDayOverride)
      : getCycleAnchorDateForDay(
          contractStartAt,
          getZonedNumber(subMonths(referenceDate, 1), "yyyy"),
          getZonedNumber(subMonths(referenceDate, 1), "MM") - 1,
          grantDayOverride,
        );

  return startMonthDate;
}

export function getContractCycleEnd(
  referenceDate: Date,
  contractStartAt: string,
  grantDayOverride?: number,
) {
  const start = getContractCycleStart(referenceDate, contractStartAt, grantDayOverride);
  const nextMonth = subMonths(start, -1);
  const nextStart = getCycleAnchorDateForDay(
    contractStartAt,
    getZonedNumber(nextMonth, "yyyy"),
    getZonedNumber(nextMonth, "MM") - 1,
    grantDayOverride,
  );
  return new Date(nextStart.getTime() - 1);
}

export function getNextContractGrantDate(
  referenceDate: Date,
  contractStartAt: string,
  grantDayOverride?: number,
) {
  const start = getContractCycleStart(referenceDate, contractStartAt, grantDayOverride);
  const nextMonth = subMonths(start, -1);
  return getCycleAnchorDateForDay(
    contractStartAt,
    getZonedNumber(nextMonth, "yyyy"),
    getZonedNumber(nextMonth, "MM") - 1,
    grantDayOverride,
  );
}

export function formatIsoInAppZone(date: Date) {
  return formatInTimeZone(date, appTimeZone, "yyyy-MM-dd'T'HH:mm:ssXXX");
}
