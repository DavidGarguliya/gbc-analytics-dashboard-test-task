export const DASHBOARD_LARGE_ORDER_THRESHOLD = 50_000;
export const DASHBOARD_LATEST_ORDERS_LIMIT = 8;
export const DASHBOARD_SOURCE_COLUMN_LABEL = "Источник / метод";

export const DASHBOARD_PERIOD_OPTIONS = [
  { key: "7d", label: "7 дней" },
  { key: "30d", label: "30 дней" },
  { key: "90d", label: "90 дней" },
  { key: "all", label: "Всё время" },
  { key: "custom", label: "Свой период" },
] as const;

export const DASHBOARD_AMOUNT_BUCKETS = [
  {
    key: "under-25000",
    label: "до 25 000",
    maxExclusive: 25_000,
    minInclusive: 0,
  },
  {
    key: "25000-50000",
    label: "25 000 – 50 000",
    maxExclusive: 50_000,
    minInclusive: 25_000,
  },
  {
    key: "50000-75000",
    label: "50 000 – 75 000",
    maxExclusive: 75_000,
    minInclusive: 50_000,
  },
  {
    key: "75000-plus",
    label: "75 000+",
    maxExclusive: null,
    minInclusive: 75_000,
  },
] as const;

export type DashboardPeriodKey = (typeof DASHBOARD_PERIOD_OPTIONS)[number]["key"];
export type DashboardSortDirection = "asc" | "desc";
export type DashboardSortKey = "createdAt" | "totalSum";
export type DashboardTrendGrain = "day" | "month" | "week";

export type DashboardOrderRow = {
  created_at: string;
  currency: string;
  external_id: string | null;
  number: string | null;
  raw_json: Record<string, unknown>;
  retailcrm_id: number;
  source: string | null;
  status: string | null;
  synced_at: string;
  total_sum: number;
};

export type DashboardOrderItem = {
  initialPrice: number | null;
  productName: string;
  quantity: number | null;
};

export type DashboardOrder = {
  createdAt: string;
  currency: string;
  externalId: string | null;
  isLargeOrder: boolean;
  itemCount: number;
  items: DashboardOrderItem[];
  number: string | null;
  retailcrmId: number;
  sourceLabel: string;
  status: string | null;
  syncedAt: string;
  totalSum: number;
};

export type DashboardMoneyValue = {
  amount: number | null;
  currencyCode: string | null;
};

export type DashboardSummary = {
  averageOrderValue: DashboardMoneyValue;
  largeOrdersCount: number;
  largeOrdersRevenueShare: number | null;
  orderCount: number;
  revenue: DashboardMoneyValue;
};

export type DashboardTrendPoint = {
  key: string;
  label: string;
  ordersCount: number;
  revenueAmount: number | null;
};

export type DashboardBreakdownRow = {
  count: number;
  key: string;
  label: string;
  revenueAmount: number | null;
  share: number;
};

export type DashboardResolvedRange = {
  comparisonEnd: string | null;
  comparisonStart: string | null;
  end: string | null;
  grain: DashboardTrendGrain;
  start: string | null;
  totalDays: number;
};

export type DashboardUiFilters = {
  customEnd: string;
  customStart: string;
  onlyLargeOrders: boolean;
  periodKey: DashboardPeriodKey;
  search: string;
  showComparison: boolean;
  sortDirection: DashboardSortDirection;
  sortKey: DashboardSortKey;
  source: string;
  status: string;
};

export type DashboardFreshness = {
  absoluteLabel: string | null;
  label: string;
  lastSyncedAt: string | null;
};

export type DashboardAnalytics = {
  amountBreakdown: DashboardBreakdownRow[];
  anchorDate: string | null;
  currentSummary: DashboardSummary;
  filteredOrders: DashboardOrder[];
  freshness: DashboardFreshness;
  hasActiveFilters: boolean;
  previousSummary: DashboardSummary | null;
  range: DashboardResolvedRange;
  sourceBreakdown: DashboardBreakdownRow[];
  statusBreakdown: DashboardBreakdownRow[];
  trendSeries: DashboardTrendPoint[];
};

export type DashboardReadModel = {
  averageOrderValue: DashboardMoneyValue;
  availableSources: string[];
  availableStatuses: string[];
  currencyCode: string | null;
  lastSyncedAt: string | null;
  largeOrderThreshold: number;
  latestOrders: DashboardOrder[];
  orders: DashboardOrder[];
  ordersByDay: Array<{
    count: number;
    date: string;
  }>;
  revenueMetric: DashboardMoneyValue;
  sourceColumnLabel: typeof DASHBOARD_SOURCE_COLUMN_LABEL;
  totalOrders: number;
};

function roundValue(value: number): number {
  return Math.round(value * 100) / 100;
}

function normalizeOrderDateKey(value: string): string {
  return new Date(value).toISOString().slice(0, 10);
}

function buildIsoDateFromUtcDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function addUtcDays(value: string, amount: number): string {
  const date = new Date(`${value}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + amount);

  return buildIsoDateFromUtcDate(date);
}

function addUtcMonths(value: string, amount: number): string {
  const date = new Date(`${value}T00:00:00.000Z`);
  date.setUTCMonth(date.getUTCMonth() + amount);
  date.setUTCDate(1);

  return buildIsoDateFromUtcDate(date);
}

function normalizeWeekStartDate(value: string): string {
  const date = new Date(`${value}T00:00:00.000Z`);
  const utcDay = date.getUTCDay();
  const deltaToMonday = utcDay === 0 ? -6 : 1 - utcDay;

  date.setUTCDate(date.getUTCDate() + deltaToMonday);

  return buildIsoDateFromUtcDate(date);
}

function normalizeMonthStartDate(value: string): string {
  const date = new Date(`${value}T00:00:00.000Z`);
  date.setUTCDate(1);

  return buildIsoDateFromUtcDate(date);
}

function countDaysInclusive(start: string, end: string): number {
  const startDate = new Date(`${start}T00:00:00.000Z`);
  const endDate = new Date(`${end}T00:00:00.000Z`);

  return Math.floor((endDate.getTime() - startDate.getTime()) / 86_400_000) + 1;
}

function clampRangeStart(start: string, minDate: string): string {
  return start.localeCompare(minDate) < 0 ? minDate : start;
}

function sortOrdersByCreatedAtDesc(left: DashboardOrderRow, right: DashboardOrderRow): number {
  const dateDiff =
    new Date(right.created_at).getTime() - new Date(left.created_at).getTime();

  if (dateDiff !== 0) {
    return dateDiff;
  }

  return right.retailcrm_id - left.retailcrm_id;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function normalizeFiniteNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim().length > 0) {
    const normalized = Number(value);

    return Number.isFinite(normalized) ? normalized : null;
  }

  return null;
}

function readDashboardOrderItems(rawJson: Record<string, unknown>): DashboardOrderItem[] {
  const candidateItems = rawJson.items;

  if (!Array.isArray(candidateItems)) {
    return [];
  }

  return candidateItems
    .filter(isObject)
    .map((item, index) => ({
      initialPrice: normalizeFiniteNumber(item.initialPrice),
      productName:
        typeof item.productName === "string" && item.productName.trim().length > 0
          ? item.productName.trim()
          : `Позиция ${index + 1}`,
      quantity: normalizeFiniteNumber(item.quantity),
    }));
}

function readSingleCurrency(orders: readonly Pick<DashboardOrder, "currency">[]): string | null {
  const uniqueCurrencies = [...new Set(orders.map((order) => order.currency))];

  return uniqueCurrencies.length === 1 ? uniqueCurrencies[0] : null;
}

function buildMoneyValue(input: {
  amount: number | null;
  currencyCode: string | null;
}): DashboardMoneyValue {
  return {
    amount: input.amount,
    currencyCode: input.currencyCode,
  };
}

function sortDimensionLabels(left: string, right: string): number {
  if (left === "Не указан") {
    return 1;
  }

  if (right === "Не указан") {
    return -1;
  }

  return left.localeCompare(right, "ru");
}

function buildOrdersByDay(orders: readonly DashboardOrder[]): DashboardReadModel["ordersByDay"] {
  const countsByDay = new Map<string, number>();

  for (const order of orders) {
    const day = normalizeOrderDateKey(order.createdAt);
    countsByDay.set(day, (countsByDay.get(day) ?? 0) + 1);
  }

  return [...countsByDay.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([date, count]) => ({ count, date }));
}

function buildLatestOrders(orders: readonly DashboardOrder[]): DashboardOrder[] {
  return orders.slice(0, DASHBOARD_LATEST_ORDERS_LIMIT);
}

function buildSummary(input: {
  currencyHint: string | null;
  orders: readonly DashboardOrder[];
}): DashboardSummary {
  const { currencyHint, orders } = input;
  const orderCount = orders.length;
  const singleCurrency = readSingleCurrency(orders) ?? currencyHint;
  const revenueAmount =
    orderCount === 0
      ? singleCurrency === null
        ? null
        : 0
      : readSingleCurrency(orders) === null
        ? null
        : roundValue(orders.reduce((sum, order) => sum + order.totalSum, 0));
  const averageOrderValue =
    revenueAmount === null || orderCount === 0 ? revenueAmount : roundValue(revenueAmount / orderCount);
  const largeOrders = orders.filter((order) => order.isLargeOrder);
  const largeOrdersRevenue =
    revenueAmount === null
      ? null
      : roundValue(largeOrders.reduce((sum, order) => sum + order.totalSum, 0));

  return {
    averageOrderValue: buildMoneyValue({
      amount: averageOrderValue,
      currencyCode: singleCurrency,
    }),
    largeOrdersCount: largeOrders.length,
    largeOrdersRevenueShare:
      revenueAmount === null || revenueAmount === 0 || largeOrdersRevenue === null
        ? revenueAmount === 0
          ? 0
          : null
        : roundValue(largeOrdersRevenue / revenueAmount),
    orderCount,
    revenue: buildMoneyValue({
      amount: revenueAmount,
      currencyCode: singleCurrency,
    }),
  };
}

function buildStatusBreakdown(orders: readonly DashboardOrder[]): DashboardBreakdownRow[] {
  if (orders.length === 0) {
    return [];
  }

  const counts = new Map<string, number>();

  for (const order of orders) {
    const label = order.status?.trim() || "Не указан";
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }

  return [...counts.entries()]
    .sort((left, right) => {
      const countDiff = right[1] - left[1];

      if (countDiff !== 0) {
        return countDiff;
      }

      return left[0].localeCompare(right[0], "ru");
    })
    .map(([label, count]) => ({
      count,
      key: label,
      label,
      revenueAmount: null,
      share: roundValue(count / orders.length),
    }));
}

function buildSourceBreakdown(input: {
  currencyHint: string | null;
  orders: readonly DashboardOrder[];
}): DashboardBreakdownRow[] {
  const { currencyHint, orders } = input;

  if (orders.length === 0) {
    return [];
  }

  const singleCurrency = readSingleCurrency(orders) ?? currencyHint;
  const allowRevenue = readSingleCurrency(orders) !== null || orders.length === 0;
  const buckets = new Map<string, { count: number; revenue: number }>();

  for (const order of orders) {
    const existingBucket = buckets.get(order.sourceLabel) ?? {
      count: 0,
      revenue: 0,
    };

    existingBucket.count += 1;
    existingBucket.revenue += order.totalSum;
    buckets.set(order.sourceLabel, existingBucket);
  }

  return [...buckets.entries()]
    .sort((left, right) => {
      const countDiff = right[1].count - left[1].count;

      if (countDiff !== 0) {
        return countDiff;
      }

      return sortDimensionLabels(left[0], right[0]);
    })
    .map(([label, bucket]) => ({
      count: bucket.count,
      key: label,
      label,
      revenueAmount:
        allowRevenue && singleCurrency !== null ? roundValue(bucket.revenue) : null,
      share: roundValue(bucket.count / orders.length),
    }));
}

function buildAmountBreakdown(orders: readonly DashboardOrder[]): DashboardBreakdownRow[] {
  const totalOrders = orders.length;

  return DASHBOARD_AMOUNT_BUCKETS.map((bucket) => {
    const count = orders.filter((order) => {
      if (order.totalSum < bucket.minInclusive) {
        return false;
      }

      if (bucket.maxExclusive !== null && order.totalSum >= bucket.maxExclusive) {
        return false;
      }

      return true;
    }).length;

    return {
      count,
      key: bucket.key,
      label: bucket.label,
      revenueAmount: null,
      share: totalOrders === 0 ? 0 : roundValue(count / totalOrders),
    };
  });
}

function formatAbsoluteFreshness(value: string | null): string | null {
  if (value === null) {
    return null;
  }

  return new Intl.DateTimeFormat("ru-RU", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(new Date(value));
}

function buildFreshness(input: {
  lastSyncedAt: string | null;
  renderedAt: string;
}): DashboardFreshness {
  const { lastSyncedAt, renderedAt } = input;

  if (lastSyncedAt === null) {
    return {
      absoluteLabel: null,
      label: "нет данных",
      lastSyncedAt: null,
    };
  }

  const diffMs = Math.max(0, new Date(renderedAt).getTime() - new Date(lastSyncedAt).getTime());
  const diffMinutes = Math.floor(diffMs / 60_000);
  let label = "меньше минуты назад";

  if (diffMinutes >= 60 * 24) {
    const diffDays = Math.floor(diffMinutes / (60 * 24));
    label = `${diffDays} дн назад`;
  } else if (diffMinutes >= 60) {
    const diffHours = Math.floor(diffMinutes / 60);
    label = `${diffHours} ч назад`;
  } else if (diffMinutes >= 1) {
    label = `${diffMinutes} мин назад`;
  }

  return {
    absoluteLabel: formatAbsoluteFreshness(lastSyncedAt),
    label,
    lastSyncedAt,
  };
}

function resolveTrendGrain(totalDays: number): DashboardTrendGrain {
  if (totalDays <= 31) {
    return "day";
  }

  if (totalDays <= 120) {
    return "week";
  }

  return "month";
}

function buildTrendBuckets(input: {
  end: string;
  grain: DashboardTrendGrain;
  start: string;
}): Array<{ key: string; label: string }> {
  const { end, grain, start } = input;

  if (grain === "day") {
    const buckets: Array<{ key: string; label: string }> = [];
    let current = start;

    while (current.localeCompare(end) <= 0) {
      buckets.push({
        key: current,
        label: new Intl.DateTimeFormat("ru-RU", {
          day: "numeric",
          month: "short",
          timeZone: "UTC",
        }).format(new Date(`${current}T00:00:00.000Z`)),
      });
      current = addUtcDays(current, 1);
    }

    return buckets;
  }

  if (grain === "week") {
    const buckets: Array<{ key: string; label: string }> = [];
    let current = normalizeWeekStartDate(start);
    const lastWeek = normalizeWeekStartDate(end);

    while (current.localeCompare(lastWeek) <= 0) {
      const weekEnd = addUtcDays(current, 6);
      buckets.push({
        key: current,
        label: `${new Intl.DateTimeFormat("ru-RU", {
          day: "numeric",
          month: "short",
          timeZone: "UTC",
        }).format(new Date(`${current}T00:00:00.000Z`))} – ${new Intl.DateTimeFormat("ru-RU", {
          day: "numeric",
          month: "short",
          timeZone: "UTC",
        }).format(new Date(`${weekEnd}T00:00:00.000Z`))}`,
      });
      current = addUtcDays(current, 7);
    }

    return buckets;
  }

  const buckets: Array<{ key: string; label: string }> = [];
  let current = normalizeMonthStartDate(start);
  const lastMonth = normalizeMonthStartDate(end);

  while (current.localeCompare(lastMonth) <= 0) {
    buckets.push({
      key: current,
      label: new Intl.DateTimeFormat("ru-RU", {
        month: "short",
        timeZone: "UTC",
        year: "numeric",
      }).format(new Date(`${current}T00:00:00.000Z`)),
    });
    current = addUtcMonths(current, 1);
  }

  return buckets;
}

function buildBucketKeyForDate(input: {
  date: string;
  grain: DashboardTrendGrain;
}): string {
  if (input.grain === "day") {
    return input.date;
  }

  if (input.grain === "week") {
    return normalizeWeekStartDate(input.date);
  }

  return normalizeMonthStartDate(input.date);
}

function buildTrendSeries(input: {
  currencyHint: string | null;
  end: string | null;
  grain: DashboardTrendGrain;
  orders: readonly DashboardOrder[];
  start: string | null;
}): DashboardTrendPoint[] {
  const { currencyHint, end, grain, orders, start } = input;

  if (start === null || end === null) {
    return [];
  }

  const buckets = buildTrendBuckets({
    end,
    grain,
    start,
  });
  const index = new Map(
    buckets.map((bucket) => [
      bucket.key,
      {
        key: bucket.key,
        label: bucket.label,
        ordersCount: 0,
        revenueAmount: 0,
      },
    ]),
  );
  const singleCurrency = readSingleCurrency(orders) ?? currencyHint;
  const allowRevenue = readSingleCurrency(orders) !== null || orders.length === 0;

  for (const order of orders) {
    const bucketKey = buildBucketKeyForDate({
      date: normalizeOrderDateKey(order.createdAt),
      grain,
    });
    const bucket = index.get(bucketKey);

    if (!bucket) {
      continue;
    }

    bucket.ordersCount += 1;
    bucket.revenueAmount += order.totalSum;
  }

  return buckets.map((bucket) => {
    const resolved = index.get(bucket.key);

    return {
      key: bucket.key,
      label: bucket.label,
      ordersCount: resolved?.ordersCount ?? 0,
      revenueAmount:
        allowRevenue && singleCurrency !== null
          ? roundValue(resolved?.revenueAmount ?? 0)
          : null,
    };
  });
}

function sortDashboardOrders(input: {
  orders: readonly DashboardOrder[];
  sortDirection: DashboardSortDirection;
  sortKey: DashboardSortKey;
}): DashboardOrder[] {
  const { orders, sortDirection, sortKey } = input;
  const directionFactor = sortDirection === "asc" ? 1 : -1;

  return [...orders].sort((left, right) => {
    if (sortKey === "totalSum") {
      const amountDiff = left.totalSum - right.totalSum;

      if (amountDiff !== 0) {
        return amountDiff * directionFactor;
      }
    }

    const dateDiff = new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime();

    if (dateDiff !== 0) {
      return dateDiff * directionFactor;
    }

    return (left.retailcrmId - right.retailcrmId) * directionFactor;
  });
}

function filterDashboardOrders(input: {
  end: string | null;
  onlyLargeOrders: boolean;
  orders: readonly DashboardOrder[];
  search: string;
  source: string;
  start: string | null;
  status: string;
}): DashboardOrder[] {
  const { end, onlyLargeOrders, orders, search, source, start, status } = input;
  const normalizedSearch = search.trim().toLocaleLowerCase("ru");

  return orders.filter((order) => {
    const orderDate = normalizeOrderDateKey(order.createdAt);

    if (start !== null && orderDate.localeCompare(start) < 0) {
      return false;
    }

    if (end !== null && orderDate.localeCompare(end) > 0) {
      return false;
    }

    if (status !== "all" && (order.status?.trim() || "Не указан") !== status) {
      return false;
    }

    if (source !== "all" && order.sourceLabel !== source) {
      return false;
    }

    if (onlyLargeOrders && !order.isLargeOrder) {
      return false;
    }

    if (normalizedSearch.length === 0) {
      return true;
    }

    const haystack = [order.number ?? "", order.externalId ?? ""]
      .join(" ")
      .toLocaleLowerCase("ru");

    return haystack.includes(normalizedSearch);
  });
}

function resolveDashboardRange(input: {
  customEnd: string;
  customStart: string;
  orders: readonly DashboardOrder[];
  periodKey: DashboardPeriodKey;
}): DashboardResolvedRange {
  const { customEnd, customStart, orders, periodKey } = input;

  if (orders.length === 0) {
    return {
      comparisonEnd: null,
      comparisonStart: null,
      end: null,
      grain: "day",
      start: null,
      totalDays: 0,
    };
  }

  const sortedDateKeys = orders
    .map((order) => normalizeOrderDateKey(order.createdAt))
    .sort((left, right) => left.localeCompare(right));
  const minDate = sortedDateKeys[0]!;
  const maxDate = sortedDateKeys.at(-1)!;

  let start = minDate;
  let end = maxDate;

  switch (periodKey) {
    case "7d":
      start = clampRangeStart(addUtcDays(maxDate, -6), minDate);
      end = maxDate;
      break;
    case "30d":
      start = clampRangeStart(addUtcDays(maxDate, -29), minDate);
      end = maxDate;
      break;
    case "90d":
      start = clampRangeStart(addUtcDays(maxDate, -89), minDate);
      end = maxDate;
      break;
    case "custom": {
      const candidateStart = customStart.length > 0 ? customStart : minDate;
      const candidateEnd = customEnd.length > 0 ? customEnd : maxDate;
      start =
        candidateStart.localeCompare(candidateEnd) <= 0 ? candidateStart : candidateEnd;
      end = candidateStart.localeCompare(candidateEnd) <= 0 ? candidateEnd : candidateStart;

      if (start.localeCompare(minDate) < 0) {
        start = minDate;
      }

      if (end.localeCompare(maxDate) > 0) {
        end = maxDate;
      }

      break;
    }
    case "all":
    default:
      start = minDate;
      end = maxDate;
      break;
  }

  const totalDays = countDaysInclusive(start, end);
  const grain = resolveTrendGrain(totalDays);
  const comparisonEnd = periodKey === "all" ? null : addUtcDays(start, -1);
  const comparisonStart =
    comparisonEnd === null ? null : addUtcDays(comparisonEnd, -(totalDays - 1));

  return {
    comparisonEnd,
    comparisonStart,
    end,
    grain,
    start,
    totalDays,
  };
}

export function buildDashboardReadModel(input: {
  lastSyncedAt: string | null;
  orders: readonly DashboardOrderRow[];
}): DashboardReadModel {
  const normalizedOrders = [...input.orders]
    .sort(sortOrdersByCreatedAtDesc)
    .map((order) => {
      const items = readDashboardOrderItems(order.raw_json);

      return {
        createdAt: order.created_at,
        currency: order.currency,
        externalId: order.external_id,
        isLargeOrder:
          order.currency === "KZT" && Number(order.total_sum) > DASHBOARD_LARGE_ORDER_THRESHOLD,
        itemCount: items.length,
        items,
        number: order.number,
        retailcrmId: order.retailcrm_id,
        sourceLabel: order.source?.trim() || "Не указан",
        status: order.status,
        syncedAt: order.synced_at,
        totalSum: Number(order.total_sum),
      } satisfies DashboardOrder;
    });
  const currencyCode = readSingleCurrency(normalizedOrders);
  const overallSummary = buildSummary({
    currencyHint: currencyCode,
    orders: normalizedOrders,
  });
  const ordersByDay = buildOrdersByDay(normalizedOrders);

  return {
    averageOrderValue: overallSummary.averageOrderValue,
    availableSources: [...new Set(normalizedOrders.map((order) => order.sourceLabel))].sort(
      sortDimensionLabels,
    ),
    availableStatuses: [
      ...new Set(normalizedOrders.map((order) => order.status?.trim() || "Не указан")),
    ].sort(sortDimensionLabels),
    currencyCode,
    lastSyncedAt: input.lastSyncedAt,
    largeOrderThreshold: DASHBOARD_LARGE_ORDER_THRESHOLD,
    latestOrders: buildLatestOrders(normalizedOrders),
    orders: normalizedOrders,
    ordersByDay,
    revenueMetric: overallSummary.revenue,
    sourceColumnLabel: DASHBOARD_SOURCE_COLUMN_LABEL,
    totalOrders: normalizedOrders.length,
  };
}

export function buildDashboardAnalytics(input: {
  dashboard: DashboardReadModel;
  filters: DashboardUiFilters;
  renderedAt: string;
}): DashboardAnalytics {
  const { dashboard, filters, renderedAt } = input;
  const range = resolveDashboardRange({
    customEnd: filters.customEnd,
    customStart: filters.customStart,
    orders: dashboard.orders,
    periodKey: filters.periodKey,
  });
  const currentOrders = filterDashboardOrders({
    end: range.end,
    onlyLargeOrders: filters.onlyLargeOrders,
    orders: dashboard.orders,
    search: filters.search,
    source: filters.source,
    start: range.start,
    status: filters.status,
  });
  const previousOrders =
    filters.showComparison && range.comparisonStart !== null && range.comparisonEnd !== null
      ? filterDashboardOrders({
          end: range.comparisonEnd,
          onlyLargeOrders: filters.onlyLargeOrders,
          orders: dashboard.orders,
          search: filters.search,
          source: filters.source,
          start: range.comparisonStart,
          status: filters.status,
        })
      : [];
  const usingCustomPeriod = filters.periodKey === "custom";

  return {
    amountBreakdown: buildAmountBreakdown(currentOrders),
    anchorDate:
      dashboard.orders.length === 0
        ? null
        : normalizeOrderDateKey(dashboard.orders[0]!.createdAt),
    currentSummary: buildSummary({
      currencyHint: dashboard.currencyCode,
      orders: currentOrders,
    }),
    filteredOrders: sortDashboardOrders({
      orders: currentOrders,
      sortDirection: filters.sortDirection,
      sortKey: filters.sortKey,
    }),
    freshness: buildFreshness({
      lastSyncedAt: dashboard.lastSyncedAt,
      renderedAt,
    }),
    hasActiveFilters:
      filters.periodKey !== "all" ||
      filters.showComparison ||
      filters.status !== "all" ||
      filters.source !== "all" ||
      filters.onlyLargeOrders ||
      filters.search.trim().length > 0 ||
      (usingCustomPeriod && (filters.customStart.length > 0 || filters.customEnd.length > 0)),
    previousSummary:
      filters.showComparison && range.comparisonStart !== null && range.comparisonEnd !== null
        ? buildSummary({
            currencyHint: dashboard.currencyCode,
            orders: previousOrders,
          })
        : null,
    range,
    sourceBreakdown: buildSourceBreakdown({
      currencyHint: dashboard.currencyCode,
      orders: currentOrders,
    }),
    statusBreakdown: buildStatusBreakdown(currentOrders),
    trendSeries: buildTrendSeries({
      currencyHint: dashboard.currencyCode,
      end: range.end,
      grain: range.grain,
      orders: currentOrders,
      start: range.start,
    }),
  };
}
