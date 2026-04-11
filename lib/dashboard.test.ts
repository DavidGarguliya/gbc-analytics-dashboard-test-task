import { describe, expect, it } from "vitest";

import {
  buildDashboardAnalytics,
  buildDashboardReadModel,
  isOrderWithinTrendPoint,
  type DashboardOrderRow,
} from "@/lib/dashboard";

const sampleOrders: DashboardOrderRow[] = [
  {
    retailcrm_id: 88,
    external_id: "mock-order-0048",
    number: "MOCK-0048",
    created_at: "2026-02-17T09:00:00+00:00",
    status: "offer-analog",
    customer_name: "Алина Ким",
    phone: "+77070000048",
    total_sum: 105000,
    currency: "KZT",
    source: "shopping-cart",
    synced_at: "2026-04-10T10:00:00+00:00",
    raw_json: {
      delivery: {
        address: {
          city: "Алматы",
        },
      },
      orderMethod: "shopping-cart",
      items: [
        {
          initialPrice: 55000,
          productName: "Комплект Premium",
          quantity: 2,
        },
      ],
    },
  },
  {
    retailcrm_id: 90,
    external_id: "mock-order-0050",
    number: "MOCK-0050",
    created_at: "2026-02-19T09:00:00+00:00",
    status: "offer-analog",
    customer_name: "Феруза Юсупова",
    phone: "+77090123450",
    total_sum: 81000,
    currency: "KZT",
    source: "shopping-cart",
    synced_at: "2026-04-10T10:00:00+00:00",
    raw_json: {
      customFields: {
        utm_source: "google",
      },
      delivery: {
        address: {
          city: "Шымкент",
        },
      },
      orderMethod: "shopping-cart",
      items: [
        {
          initialPrice: 31000,
          productName: "Топ Soft",
          quantity: 1,
        },
        {
          initialPrice: 50000,
          productName: "Комплект Balance",
          quantity: 1,
        },
      ],
    },
  },
  {
    retailcrm_id: 89,
    external_id: "mock-order-0049",
    number: "MOCK-0049",
    created_at: "2026-02-18T09:00:00+00:00",
    status: "offer-analog",
    customer_name: "Карина Осипова",
    phone: "+77070000049",
    total_sum: 37000,
    currency: "KZT",
    source: "instagram",
    synced_at: "2026-04-10T10:00:00+00:00",
    raw_json: {
      customFields: {
        utm_source: "instagram",
      },
      delivery: {
        address: {
          city: "Астана",
        },
      },
      items: [
        {
          initialPrice: 37000,
          productName: "Платье Shape",
          quantity: 1,
        },
      ],
    },
  },
  {
    retailcrm_id: 87,
    external_id: "mock-order-0047",
    number: "MOCK-0047",
    created_at: "2026-02-17T12:00:00+00:00",
    status: "new",
    customer_name: null,
    phone: null,
    total_sum: 12000,
    currency: "KZT",
    source: null,
    synced_at: "2026-04-10T10:00:00+00:00",
    raw_json: {
      delivery: {
        address: {
          city: "Караганда",
        },
      },
      items: [],
    },
  },
];

describe("buildDashboardReadModel", () => {
  it("normalizes orders, sources, statuses, and last sync metadata for the dashboard", () => {
    expect(
      buildDashboardReadModel({
        lastSyncedAt: "2026-04-10T12:00:00.000Z",
        orders: sampleOrders,
      }),
    ).toEqual(
      expect.objectContaining({
      availableMarketingSources: ["google", "instagram"],
      availableStatuses: ["Предложить замену", "new"],
      averageOrderValue: { amount: 58750, currencyCode: "KZT" },
      currencyCode: "KZT",
      lastSyncedAt: "2026-04-10T12:00:00.000Z",
      largeOrderThreshold: 50000,
      orders: [
        expect.objectContaining({
          retailcrmId: 90,
          itemCount: 2,
          unitsCount: 2,
          customerName: "Феруза Юсупова",
          city: "Шымкент",
          marketingSource: "google",
          orderMethod: "shopping-cart",
          isLargeOrder: true,
        }),
        expect.objectContaining({
          retailcrmId: 89,
          itemCount: 1,
          unitsCount: 1,
          customerName: "Карина Осипова",
          city: "Астана",
          marketingSource: "instagram",
          orderMethod: null,
          isLargeOrder: false,
        }),
        expect.objectContaining({
          retailcrmId: 87,
          itemCount: 0,
          unitsCount: 0,
          city: "Караганда",
          marketingSource: null,
          orderMethod: null,
          isLargeOrder: false,
        }),
        expect.objectContaining({
          retailcrmId: 88,
          itemCount: 1,
          unitsCount: 2,
          customerName: "Алина Ким",
          city: "Алматы",
          marketingSource: null,
          orderMethod: "shopping-cart",
          isLargeOrder: true,
        }),
      ],
      }),
    );
  });
});

describe("buildDashboardAnalytics", () => {
  it("builds summary metrics, trends, and breakdowns for the selected slice", () => {
    const dashboard = buildDashboardReadModel({
      lastSyncedAt: "2026-04-10T12:00:00.000Z",
      orders: sampleOrders,
    });

    expect(
      buildDashboardAnalytics({
        dashboard,
        filters: {
          customEnd: "",
          customStart: "",
          onlyLargeOrders: false,
          periodKey: "all",
          search: "",
          showComparison: false,
          sortDirection: "desc",
          sortKey: "createdAt",
          marketingSource: "all",
          status: "all",
        },
        renderedAt: "2026-04-10T12:05:00.000Z",
      }),
    ).toEqual({
      amountBreakdown: [
        {
          averageOrderValue: 12000,
          count: 1,
          key: "under-25000",
          label: "до 25 000",
          largeOrdersCount: null,
          previousRevenueAmount: null,
          revenueAmount: 12000,
          revenueShare: null,
          share: 0.25,
        },
        {
          averageOrderValue: 37000,
          count: 1,
          key: "25000-50000",
          label: "25 000 – 50 000",
          largeOrdersCount: null,
          previousRevenueAmount: null,
          revenueAmount: 37000,
          revenueShare: null,
          share: 0.25,
        },
        {
          averageOrderValue: null,
          count: 0,
          key: "50000-75000",
          label: "50 000 – 75 000",
          largeOrdersCount: null,
          previousRevenueAmount: null,
          revenueAmount: null,
          revenueShare: null,
          share: 0,
        },
        {
          averageOrderValue: 93000,
          count: 2,
          key: "75000-plus",
          label: "75 000+",
          largeOrdersCount: null,
          previousRevenueAmount: null,
          revenueAmount: 186000,
          revenueShare: null,
          share: 0.5,
        },
      ],
      anchorDate: "2026-02-19",
      currentSummary: {
        averageOrderValue: {
          amount: 58750,
          currencyCode: "KZT",
        },
        largeOrdersCount: 2,
        largeOrdersRevenueShare: 0.79,
        orderCount: 4,
        revenue: {
          amount: 235000,
          currencyCode: "KZT",
        },
      },
      filteredOrders: [
        expect.objectContaining({ retailcrmId: 90 }),
        expect.objectContaining({ retailcrmId: 89 }),
        expect.objectContaining({ retailcrmId: 87 }),
        expect.objectContaining({ retailcrmId: 88 }),
      ],
      freshness: {
        absoluteLabel: "10 апр. 2026 г., 15:00 МСК / 17:00 Алматы",
        label: "5 мин назад",
        lastSyncedAt: "2026-04-10T12:00:00.000Z",
      },
      hasActiveFilters: false,
      previousSummary: null,
      range: {
        comparisonEnd: null,
        comparisonStart: null,
        end: "2026-02-19",
        grain: "day",
        start: "2026-02-17",
        totalDays: 3,
      },
      marketingSourceBreakdown: [
        {
          averageOrderValue: 58500,
          count: 2,
          key: "Не указан",
          label: "Не указан",
          largeOrdersCount: 1,
          previousRevenueAmount: null,
          revenueAmount: 117000,
          revenueShare: 0.5,
          share: 0.5,
        },
        {
          averageOrderValue: 81000,
          count: 1,
          key: "google",
          label: "google",
          largeOrdersCount: 1,
          previousRevenueAmount: null,
          revenueAmount: 81000,
          revenueShare: 0.34,
          share: 0.25,
        },
        {
          averageOrderValue: 37000,
          count: 1,
          key: "instagram",
          label: "instagram",
          largeOrdersCount: 0,
          previousRevenueAmount: null,
          revenueAmount: 37000,
          revenueShare: 0.16,
          share: 0.25,
        },
      ],
      orderMethodBreakdown: [
        {
          averageOrderValue: 93000,
          count: 2,
          key: "Через корзину",
          label: "Через корзину",
          largeOrdersCount: null,
          previousRevenueAmount: null,
          revenueAmount: 186000,
          revenueShare: null,
          share: 0.5,
        },
        {
          averageOrderValue: 24500,
          count: 2,
          key: "Не указан",
          label: "Не указан",
          largeOrdersCount: null,
          previousRevenueAmount: null,
          revenueAmount: 49000,
          revenueShare: null,
          share: 0.5,
        },
      ],
      statusBreakdown: [
        {
          averageOrderValue: null,
          count: 3,
          key: "Предложить замену",
          label: "Предложить замену",
          largeOrdersCount: null,
          previousRevenueAmount: null,
          revenueAmount: null,
          revenueShare: null,
          share: 0.75,
        },
        {
          averageOrderValue: null,
          count: 1,
          key: "new",
          label: "new",
          largeOrdersCount: null,
          previousRevenueAmount: null,
          revenueAmount: null,
          revenueShare: null,
          share: 0.25,
        },
      ],
      trendSeries: [
        {
          averageOrderValue: 58500,
          endDate: "2026-02-17",
          key: "2026-02-17",
          largeOrdersCount: 1,
          label: "17 февр.",
          ordersCount: 2,
          revenueAmount: 117000,
          startDate: "2026-02-17",
        },
        {
          averageOrderValue: 37000,
          endDate: "2026-02-18",
          key: "2026-02-18",
          largeOrdersCount: 0,
          label: "18 февр.",
          ordersCount: 1,
          revenueAmount: 37000,
          startDate: "2026-02-18",
        },
        {
          averageOrderValue: 81000,
          endDate: "2026-02-19",
          key: "2026-02-19",
          largeOrdersCount: 1,
          label: "19 февр.",
          ordersCount: 1,
          revenueAmount: 81000,
          startDate: "2026-02-19",
        },
      ],
    });
  });

  it("applies search and large-order filters before sorting the table", () => {
    const dashboard = buildDashboardReadModel({
      lastSyncedAt: "2026-04-10T12:00:00.000Z",
      orders: sampleOrders,
    });

    const analytics = buildDashboardAnalytics({
      dashboard,
      filters: {
        customEnd: "",
        customStart: "",
        onlyLargeOrders: true,
        periodKey: "all",
        search: "mock-00",
        showComparison: false,
        sortDirection: "asc",
        sortKey: "totalSum",
        marketingSource: "all",
        status: "all",
      },
      renderedAt: "2026-04-10T12:05:00.000Z",
    });

    expect(analytics.currentSummary).toEqual({
      averageOrderValue: {
        amount: 93000,
        currencyCode: "KZT",
      },
      largeOrdersCount: 2,
      largeOrdersRevenueShare: 1,
      orderCount: 2,
      revenue: {
        amount: 186000,
        currencyCode: "KZT",
      },
    });
    expect(analytics.hasActiveFilters).toBe(true);
  });

  it("filters by marketing source without falling back to the mixed persisted source field", () => {
    const dashboard = buildDashboardReadModel({
      lastSyncedAt: "2026-04-10T12:00:00.000Z",
      orders: sampleOrders,
    });

    const analytics = buildDashboardAnalytics({
      dashboard,
      filters: {
        customEnd: "",
        customStart: "",
        marketingSource: "instagram",
        onlyLargeOrders: false,
        periodKey: "all",
        search: "",
        showComparison: false,
        sortDirection: "desc",
        sortKey: "createdAt",
        status: "all",
      },
      renderedAt: "2026-04-10T12:05:00.000Z",
    });

    expect(analytics.filteredOrders.map((order) => order.retailcrmId)).toEqual([89]);
    expect(analytics.currentSummary).toEqual({
      averageOrderValue: {
        amount: 37000,
        currencyCode: "KZT",
      },
      largeOrdersCount: 0,
      largeOrdersRevenueShare: 0,
      orderCount: 1,
      revenue: {
        amount: 37000,
        currencyCode: "KZT",
      },
    });
  });

  it("keeps revenue metrics honest when the filtered slice contains mixed currencies", () => {
    const dashboard = buildDashboardReadModel({
      lastSyncedAt: "2026-04-10T12:00:00.000Z",
      orders: [
        sampleOrders[0],
        {
          ...sampleOrders[1],
          currency: "USD",
        },
      ],
    });

    const analytics = buildDashboardAnalytics({
      dashboard,
      filters: {
        customEnd: "",
        customStart: "",
        onlyLargeOrders: false,
        periodKey: "all",
        search: "",
        showComparison: false,
        sortDirection: "desc",
        sortKey: "createdAt",
        marketingSource: "all",
        status: "all",
      },
      renderedAt: "2026-04-10T12:05:00.000Z",
    });

    expect(analytics.currentSummary.revenue).toEqual({
      amount: null,
      currencyCode: null,
    });
    expect(analytics.currentSummary.averageOrderValue).toEqual({
      amount: null,
      currencyCode: null,
    });
    expect(analytics.trendSeries.every((point) => point.revenueAmount === null)).toBe(true);
    expect(
      analytics.marketingSourceBreakdown.every((row) => row.revenueAmount === null),
    ).toBe(true);
    expect(
      analytics.marketingSourceBreakdown.every((row) => row.revenueShare === null),
    ).toBe(true);
    expect(
      analytics.orderMethodBreakdown.every((row) => row.revenueAmount === null),
    ).toBe(true);
  });

  it("adds revenue-share and comparison-period context to marketing source breakdowns", () => {
    const dashboard = buildDashboardReadModel({
      lastSyncedAt: "2026-04-10T12:00:00.000Z",
      orders: [
        ...sampleOrders,
        {
          ...sampleOrders[1],
          retailcrm_id: 91,
          external_id: "mock-order-0051",
          number: "MOCK-0051",
          created_at: "2026-02-17T08:00:00+00:00",
          total_sum: 40000,
          raw_json: {
            ...sampleOrders[1].raw_json,
            customFields: {
              utm_source: "google",
            },
          },
        },
      ],
    });

    const analytics = buildDashboardAnalytics({
      dashboard,
      filters: {
        customEnd: "2026-02-19",
        customStart: "2026-02-18",
        marketingSource: "all",
        onlyLargeOrders: false,
        periodKey: "custom",
        search: "",
        showComparison: true,
        sortDirection: "desc",
        sortKey: "createdAt",
        status: "all",
      },
      renderedAt: "2026-04-10T12:05:00.000Z",
    });

    expect(analytics.marketingSourceBreakdown).toEqual([
      {
        averageOrderValue: 81000,
        count: 1,
        key: "google",
        label: "google",
        largeOrdersCount: 1,
        previousRevenueAmount: 40000,
        revenueAmount: 81000,
        revenueShare: 0.69,
        share: 0.5,
      },
      {
        averageOrderValue: 37000,
        count: 1,
        key: "instagram",
        label: "instagram",
        largeOrdersCount: 0,
        previousRevenueAmount: 0,
        revenueAmount: 37000,
        revenueShare: 0.31,
        share: 0.5,
      },
    ]);
  });

  it("detects whether an order belongs to a selected trend bucket", () => {
    expect(
      isOrderWithinTrendPoint({
        createdAt: "2026-02-18T09:00:00+00:00",
        point: {
          averageOrderValue: 49020,
          endDate: "2026-02-23",
          key: "2026-02-17",
          largeOrdersCount: 2,
          label: "17 февр. – 23 февр.",
          ordersCount: 4,
          revenueAmount: 196080,
          startDate: "2026-02-17",
        },
      }),
    ).toBe(true);

    expect(
      isOrderWithinTrendPoint({
        createdAt: "2026-02-24T09:00:00+00:00",
        point: {
          averageOrderValue: 49020,
          endDate: "2026-02-23",
          key: "2026-02-17",
          largeOrdersCount: 2,
          label: "17 февр. – 23 февр.",
          ordersCount: 4,
          revenueAmount: 196080,
          startDate: "2026-02-17",
        },
      }),
    ).toBe(false);
  });
});
