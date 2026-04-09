import { describe, expect, it } from "vitest";

import {
  RETAILCRM_ORDERS_SYNC_STATE_KEY,
  RETAILCRM_SYNC_PAGE_SIZE,
  buildRetailCrmOrdersSyncState,
  mapRetailCrmOrderToSupabaseOrder,
  normalizeRetailCrmTimestamp,
} from "@/lib/retailcrm-sync";

const sampleLiveOrder = {
  id: 90,
  externalId: "mock-order-0050",
  number: "MOCK-0050",
  createdAt: "2026-02-19 09:00:00",
  status: "offer-analog",
  totalSumm: 81000,
  currency: "KZT",
  orderType: "main",
  orderMethod: "shopping-cart",
  site: "garguliyadavid",
  firstName: "Феруза",
  lastName: "Юсупова",
  phone: "+77090123450",
  customFields: {
    utm_source: "referral",
  },
  items: [],
};

describe("normalizeRetailCrmTimestamp", () => {
  it("converts RetailCRM timestamps into deterministic UTC ISO strings", () => {
    expect(normalizeRetailCrmTimestamp("2026-02-19 09:00:00")).toBe(
      "2026-02-19T09:00:00.000Z",
    );
  });
});

describe("mapRetailCrmOrderToSupabaseOrder", () => {
  it("maps the live RetailCRM record into the Supabase order shape without reinterpreting fields", () => {
    expect(
      mapRetailCrmOrderToSupabaseOrder(sampleLiveOrder, "2026-04-10T12:00:00.000Z"),
    ).toEqual({
      retailcrm_id: 90,
      external_id: "mock-order-0050",
      number: "MOCK-0050",
      created_at: "2026-02-19T09:00:00.000Z",
      status: "offer-analog",
      customer_name: "Феруза Юсупова",
      phone: "+77090123450",
      total_sum: 81000,
      currency: "KZT",
      source: "referral",
      raw_json: sampleLiveOrder,
      synced_at: "2026-04-10T12:00:00.000Z",
    });
  });

  it("falls back to the live order method when no explicit source field is present", () => {
    expect(
      mapRetailCrmOrderToSupabaseOrder(
        {
          ...sampleLiveOrder,
          customFields: {},
        },
        "2026-04-10T12:00:00.000Z",
      ).source,
    ).toBe("shopping-cart");
  });
});

describe("buildRetailCrmOrdersSyncState", () => {
  it("builds an explicit full-scan state payload for the completed sync", () => {
    expect(
      buildRetailCrmOrdersSyncState({
        completedAt: "2026-04-10T12:00:00.000Z",
        fetchedOrders: 50,
        latestCreatedAt: "2026-02-19T09:00:00.000Z",
        latestRetailCrmId: 90,
        pagesProcessed: 1,
        site: "garguliyadavid",
        upsertedOrders: 50,
      }),
    ).toEqual({
      completedAt: "2026-04-10T12:00:00.000Z",
      cursor: {
        latestCreatedAt: "2026-02-19T09:00:00.000Z",
        latestRetailCrmId: 90,
        mode: "full-scan",
        pageSize: RETAILCRM_SYNC_PAGE_SIZE,
        site: "garguliyadavid",
      },
      stats: {
        fetchedOrders: 50,
        pagesProcessed: 1,
        upsertedOrders: 50,
      },
      syncKey: RETAILCRM_ORDERS_SYNC_STATE_KEY,
    });
  });
});
