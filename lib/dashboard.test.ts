import { describe, expect, it } from "vitest";

import {
  DASHBOARD_LATEST_ORDERS_LIMIT,
  buildDashboardReadModel,
} from "@/lib/dashboard";

const sampleOrders = [
  {
    retailcrm_id: 88,
    external_id: "mock-order-0048",
    number: "MOCK-0048",
    created_at: "2026-02-17T09:00:00+00:00",
    status: "offer-analog",
    total_sum: 105000,
    currency: "RUB",
    source: "shopping-cart",
    synced_at: "2026-04-10T10:00:00+00:00",
  },
  {
    retailcrm_id: 90,
    external_id: "mock-order-0050",
    number: "MOCK-0050",
    created_at: "2026-02-19T09:00:00+00:00",
    status: "offer-analog",
    total_sum: 81000,
    currency: "RUB",
    source: "shopping-cart",
    synced_at: "2026-04-10T10:00:00+00:00",
  },
  {
    retailcrm_id: 89,
    external_id: "mock-order-0049",
    number: "MOCK-0049",
    created_at: "2026-02-18T09:00:00+00:00",
    status: "offer-analog",
    total_sum: 37000,
    currency: "RUB",
    source: "instagram",
    synced_at: "2026-04-10T10:00:00+00:00",
  },
  {
    retailcrm_id: 87,
    external_id: "mock-order-0047",
    number: "MOCK-0047",
    created_at: "2026-02-17T12:00:00+00:00",
    status: "new",
    total_sum: 12000,
    currency: "RUB",
    source: null,
    synced_at: "2026-04-10T10:00:00+00:00",
  },
] as const;

describe("buildDashboardReadModel", () => {
  it("builds dashboard metrics, latest orders, and orders-by-day from Supabase rows", () => {
    expect(buildDashboardReadModel(sampleOrders)).toEqual({
      averageOrderValue: {
        amount: 58750,
        currencyCode: "RUB",
        label: "Average order value",
      },
      latestOrders: [
        expect.objectContaining({
          retailcrmId: 90,
          sourceLabel: "shopping-cart",
        }),
        expect.objectContaining({
          retailcrmId: 89,
          sourceLabel: "instagram",
        }),
        expect.objectContaining({
          retailcrmId: 87,
          sourceLabel: "Unspecified",
        }),
        expect.objectContaining({
          retailcrmId: 88,
          sourceLabel: "shopping-cart",
        }),
      ],
      ordersByDay: [
        { count: 2, date: "2026-02-17" },
        { count: 1, date: "2026-02-18" },
        { count: 1, date: "2026-02-19" },
      ],
      revenueMetric: {
        amount: 235000,
        currencyCode: "RUB",
        label: "Total revenue",
      },
      sourceColumnLabel: "Source / Method",
      totalOrders: 4,
    });
  });

  it("avoids claiming a converted revenue metric when the stored data contains mixed currencies", () => {
    expect(
      buildDashboardReadModel([
        sampleOrders[0],
        {
          ...sampleOrders[1],
          currency: "KZT",
        },
      ]),
    ).toEqual(
      expect.objectContaining({
        averageOrderValue: {
          amount: null,
          currencyCode: null,
          label: "Average order value",
        },
        revenueMetric: {
          amount: null,
          currencyCode: null,
          label: "Total revenue",
        },
      }),
    );
  });

  it("caps latest orders to the configured dashboard limit", () => {
    const orders = Array.from({ length: DASHBOARD_LATEST_ORDERS_LIMIT + 2 }, (_, index) => ({
      retailcrm_id: index + 1,
      external_id: `mock-order-${index + 1}`,
      number: `MOCK-${index + 1}`,
      created_at: new Date(Date.UTC(2026, 1, index + 1, 9, 0, 0)).toISOString(),
      status: "new",
      total_sum: 1000 + index,
      currency: "RUB",
      source: "shopping-cart",
      synced_at: "2026-04-10T10:00:00+00:00",
    }));

    expect(buildDashboardReadModel(orders).latestOrders).toHaveLength(
      DASHBOARD_LATEST_ORDERS_LIMIT,
    );
  });
});
