export type AnalyticsPeriod = "day" | "week" | "month" | "year";

export function getAnalyticsPeriod(value?: string): AnalyticsPeriod {
  if (value === "day" || value === "week" || value === "month" || value === "year") {
    return value;
  }

  return "month";
}

export function getRangeStart(period: AnalyticsPeriod, now = new Date()) {
  const start = new Date(now);

  if (period === "day") {
    start.setHours(0, 0, 0, 0);
    return start;
  }

  if (period === "week") {
    start.setDate(start.getDate() - 6);
    start.setHours(0, 0, 0, 0);
    return start;
  }

  if (period === "month") {
    start.setDate(start.getDate() - 29);
    start.setHours(0, 0, 0, 0);
    return start;
  }

  start.setMonth(start.getMonth() - 11, 1);
  start.setHours(0, 0, 0, 0);
  return start;
}

export function getPeriodLabel(period: AnalyticsPeriod) {
  if (period === "day") return "Dan";
  if (period === "week") return "Teden";
  if (period === "month") return "Mesec";
  return "Leto";
}
