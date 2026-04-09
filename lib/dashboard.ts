export const DASHBOARD_LATEST_ORDERS_LIMIT = 8;
export const DASHBOARD_SOURCE_COLUMN_LABEL = "Source / Method";

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
  latestOrders: DashboardLatestOrder[];
  ordersByDay: Array<{
    count: number;
    date: string;
  }>;
  revenueMetric: DashboardMoneyMetric;
  sourceColumnLabel: typeof DASHBOARD_SOURCE_COLUMN_LABEL;
  totalOrders: number;
};

function normalizeOrderDate(value: string): string {
  return new Date(value).toISOString().slice(0, 10);
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
      sourceLabel: order.source?.trim() || "Unspecified",
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

  return {
    averageOrderValue: buildMoneyMetric({
      amount: averageOrderValue,
      currencyCode: singleCurrency,
      label: "Average order value",
    }),
    latestOrders: buildLatestOrders(normalizedOrders),
    ordersByDay: buildOrdersByDay(normalizedOrders),
    revenueMetric: buildMoneyMetric({
      amount: totalRevenue,
      currencyCode: singleCurrency,
      label: "Total revenue",
    }),
    sourceColumnLabel: DASHBOARD_SOURCE_COLUMN_LABEL,
    totalOrders,
  };
}
