export type DateFilter =
  | "today"
  | "yesterday"
  | "this_month"
  | "last_month"
  | "last_60_days"
  | "last_90_days"
  | "custom"
  | "all";

export function getDateRange(filter: DateFilter, from?: string, to?: string) {
  const now = new Date();
  const startOfDay = (d: Date) =>
    new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const endOfDay = (d: Date) =>
    new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);

  switch (filter) {
    case "today": {
      const d = startOfDay(now);
      return { gte: d, lte: endOfDay(now) };
    }
    case "yesterday": {
      const d = new Date(now);
      d.setDate(d.getDate() - 1);
      return { gte: startOfDay(d), lte: endOfDay(d) };
    }
    case "this_month": {
      const first = new Date(now.getFullYear(), now.getMonth(), 1);
      const last = endOfDay(new Date(now.getFullYear(), now.getMonth() + 1, 0));
      return { gte: first, lte: last };
    }
    case "last_month": {
      const first = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const last = endOfDay(new Date(now.getFullYear(), now.getMonth(), 0));
      return { gte: first, lte: last };
    }
    case "last_60_days": {
      const d = new Date(now);
      d.setDate(d.getDate() - 60);
      return { gte: startOfDay(d), lte: endOfDay(now) };
    }
    case "last_90_days": {
      const d = new Date(now);
      d.setDate(d.getDate() - 90);
      return { gte: startOfDay(d), lte: endOfDay(now) };
    }
    case "custom": {
      if (!from && !to) return null;
      const gte = from ? startOfDay(new Date(from)) : undefined;
      const lte = to ? endOfDay(new Date(to)) : undefined;
      return { gte, lte };
    }
    default:
      return null;
  }
}
