import {
  endOfMonth,
  formatISO,
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

function getCycleAnchorDate(contractStartAt: string, targetYear: number, targetMonthIndex: number) {
  const contractDate = new Date(contractStartAt);
  const contractDay = getZonedNumber(contractDate, "dd");

  const base = setMonth(setYear(new Date(), targetYear), targetMonthIndex);
  const maxDay = getDaysInMonth(base);
  const safeDay = Math.min(contractDay, maxDay);

  return fromZonedTime(
    `${targetYear}-${String(targetMonthIndex + 1).padStart(2, "0")}-${String(safeDay).padStart(2, "0")}T00:00:00`,
    appTimeZone,
  );
}

export function getContractCycleStart(referenceDate: Date, contractStartAt: string) {
  const contractDate = new Date(contractStartAt);
  const contractDay = getZonedNumber(contractDate, "dd");
  const refYear = getZonedNumber(referenceDate, "yyyy");
  const refMonth = getZonedNumber(referenceDate, "MM") - 1;
  const refDay = getZonedNumber(referenceDate, "dd");

  const startMonthDate =
    refDay >= contractDay
      ? getCycleAnchorDate(contractStartAt, refYear, refMonth)
      : getCycleAnchorDate(
          contractStartAt,
          getZonedNumber(subMonths(referenceDate, 1), "yyyy"),
          getZonedNumber(subMonths(referenceDate, 1), "MM") - 1,
        );

  return startMonthDate;
}

export function getContractCycleEnd(referenceDate: Date, contractStartAt: string) {
  const start = getContractCycleStart(referenceDate, contractStartAt);
  const nextMonth = subMonths(start, -1);
  const nextStart = getCycleAnchorDate(
    contractStartAt,
    getZonedNumber(nextMonth, "yyyy"),
    getZonedNumber(nextMonth, "MM") - 1,
  );
  return new Date(nextStart.getTime() - 1);
}

export function getNextContractGrantDate(referenceDate: Date, contractStartAt: string) {
  const start = getContractCycleStart(referenceDate, contractStartAt);
  const nextMonth = subMonths(start, -1);
  return getCycleAnchorDate(
    contractStartAt,
    getZonedNumber(nextMonth, "yyyy"),
    getZonedNumber(nextMonth, "MM") - 1,
  );
}

export function formatIsoInAppZone(date: Date) {
  return formatISO(date);
}
