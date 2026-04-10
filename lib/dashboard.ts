export const DASHBOARD_LATEST_ORDERS_LIMIT = 8;
export const DASHBOARD_SOURCE_COLUMN_LABEL = "Источник / способ";

export type DashboardOrderRow = {
  created_at: string;
  currency: string;
  external_id: string | null;
  number: string | null;
  retailcrm_id: number;
  source: string | null;
  status: string | null;
  synced_at: string;
  total_sum: number;
};

type DashboardMoneyMetric = {
  amount: number | null;
  currencyCode: string | null;
  label: string;
};

type DashboardCadenceSummary = {
  activeDays: number;
  averageOrdersPerActiveDay: number;
  firstOrderDate: string | null;
  lastOrderDate: string | null;
  peakDayCount: number;
  steadyDailyCount: number | null;
};

type DashboardLatestOrder = {
  createdAt: string;
  currency: string;
  externalId: string | null;
  number: string | null;
  retailcrmId: number;
  sourceLabel: string;
  status: string | null;
  syncedAt: string;
  totalSum: number;
};

export type DashboardReadModel = {
  averageOrderValue: DashboardMoneyMetric;
  cadenceSummary: DashboardCadenceSummary;
  latestOrders: DashboardLatestOrder[];
  ordersByDay: Array<{
    count: number;
    date: string;
  }>;
  ordersByWeek: Array<{
    count: number;
    revenueAmount: number | null;
    weekEnd: string;
    weekStart: string;
  }>;
  revenueMetric: DashboardMoneyMetric;
  sourceColumnLabel: typeof DASHBOARD_SOURCE_COLUMN_LABEL;
  totalOrders: number;
};

function normalizeOrderDate(value: string): string {
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

function normalizeWeekStartDate(value: string): string {
  const date = new Date(value);
  const utcDay = date.getUTCDay();
  const deltaToMonday = utcDay === 0 ? -6 : 1 - utcDay;

  date.setUTCDate(date.getUTCDate() + deltaToMonday);
  date.setUTCHours(0, 0, 0, 0);

  return buildIsoDateFromUtcDate(date);
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

function buildMoneyMetric(input: {
  amount: number | null;
  currencyCode: string | null;
  label: string;
}): DashboardMoneyMetric {
  return {
    amount: input.amount,
    currencyCode: input.currencyCode,
    label: input.label,
  };
}

function sortOrdersDescending(left: DashboardOrderRow, right: DashboardOrderRow): number {
  const dateDiff =
    new Date(right.created_at).getTime() - new Date(left.created_at).getTime();

  if (dateDiff !== 0) {
    return dateDiff;
  }

  return right.retailcrm_id - left.retailcrm_id;
}

function buildOrdersByDay(orders: DashboardOrderRow[]): DashboardReadModel["ordersByDay"] {
  const countsByDay = new Map<string, number>();

  for (const order of orders) {
    const day = normalizeOrderDate(order.created_at);
    countsByDay.set(day, (countsByDay.get(day) ?? 0) + 1);
  }

  return [...countsByDay.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([date, count]) => ({ count, date }));
}

function buildCadenceSummary(input: {
  ordersByDay: DashboardReadModel["ordersByDay"];
  totalOrders: number;
}): DashboardCadenceSummary {
  const { ordersByDay, totalOrders } = input;

  if (ordersByDay.length === 0) {
    return {
      activeDays: 0,
      averageOrdersPerActiveDay: 0,
      firstOrderDate: null,
      lastOrderDate: null,
      peakDayCount: 0,
      steadyDailyCount: null,
    };
  }

  const counts = ordersByDay.map((entry) => entry.count);
  const firstDailyCount = counts[0] ?? null;
  const steadyDailyCount =
    firstDailyCount !== null && counts.every((count) => count === firstDailyCount)
      ? firstDailyCount
      : null;

  return {
    activeDays: ordersByDay.length,
    averageOrdersPerActiveDay: roundMoney(totalOrders / ordersByDay.length),
    firstOrderDate: ordersByDay[0]?.date ?? null,
    lastOrderDate: ordersByDay.at(-1)?.date ?? null,
    peakDayCount: Math.max(...counts),
    steadyDailyCount,
  };
}

function buildOrdersByWeek(input: {
  currencyCode: string | null;
  orders: DashboardOrderRow[];
}): DashboardReadModel["ordersByWeek"] {
  const { currencyCode, orders } = input;
  const buckets = new Map<
    string,
    {
      count: number;
      revenueAmount: number;
    }
  >();

  for (const order of orders) {
    const weekStart = normalizeWeekStartDate(order.created_at);
    const existingBucket = buckets.get(weekStart) ?? {
      count: 0,
      revenueAmount: 0,
    };

    existingBucket.count += 1;
    existingBucket.revenueAmount += Number(order.total_sum);
    buckets.set(weekStart, existingBucket);
  }

  return [...buckets.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([weekStart, bucket]) => ({
      count: bucket.count,
      revenueAmount: currencyCode === null ? null : roundMoney(bucket.revenueAmount),
      weekEnd: addUtcDays(weekStart, 6),
      weekStart,
    }));
}

function buildLatestOrders(orders: DashboardOrderRow[]): DashboardReadModel["latestOrders"] {
  return [...orders]
    .sort(sortOrdersDescending)
    .slice(0, DASHBOARD_LATEST_ORDERS_LIMIT)
    .map((order) => ({
      createdAt: order.created_at,
      currency: order.currency,
      externalId: order.external_id,
      number: order.number,
      retailcrmId: order.retailcrm_id,
      sourceLabel: order.source?.trim() || "Не указан",
      status: order.status,
      syncedAt: order.synced_at,
      totalSum: order.total_sum,
    }));
}

export function buildDashboardReadModel(
  orders: readonly DashboardOrderRow[],
): DashboardReadModel {
  const normalizedOrders = [...orders];
  const totalOrders = normalizedOrders.length;
  const uniqueCurrencies = [...new Set(normalizedOrders.map((order) => order.currency))];
  const singleCurrency = uniqueCurrencies.length === 1 ? uniqueCurrencies[0] : null;
  const totalRevenue =
    singleCurrency === null
      ? null
      : roundMoney(
          normalizedOrders.reduce((sum, order) => sum + Number(order.total_sum), 0),
        );
  const averageOrderValue =
    totalRevenue === null || totalOrders === 0 ? null : roundMoney(totalRevenue / totalOrders);
  const ordersByDay = buildOrdersByDay(normalizedOrders);

  return {
    averageOrderValue: buildMoneyMetric({
      amount: averageOrderValue,
      currencyCode: singleCurrency,
      label: "Средний чек",
    }),
    cadenceSummary: buildCadenceSummary({
      ordersByDay,
      totalOrders,
    }),
    latestOrders: buildLatestOrders(normalizedOrders),
    ordersByDay,
    ordersByWeek: buildOrdersByWeek({
      currencyCode: singleCurrency,
      orders: normalizedOrders,
    }),
    revenueMetric: buildMoneyMetric({
      amount: totalRevenue,
      currencyCode: singleCurrency,
      label: "Выручка",
    }),
    sourceColumnLabel: DASHBOARD_SOURCE_COLUMN_LABEL,
    totalOrders,
  };
}
