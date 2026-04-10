import { afterEach, describe, expect, it, vi } from "vitest";

import {
  getUnalertedHighValueOrders,
  getSupabaseBrowserConfig,
  getSupabaseServiceRoleConfig,
  markAlertSent,
  readSyncState,
  upsertOrders,
  writeSyncState,
} from "@/lib/supabase";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("getSupabaseBrowserConfig", () => {
  it("reads only the public Supabase configuration", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://public.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "public-anon-key";
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;

    expect(getSupabaseBrowserConfig()).toEqual({
      url: "https://public.supabase.co",
      anonKey: "public-anon-key",
    });
  });
});

describe("getSupabaseServiceRoleConfig", () => {
  it("reads the service-role configuration on the server", () => {
    process.env.SUPABASE_URL = "https://server.supabase.co";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-key";

    expect(getSupabaseServiceRoleConfig()).toEqual({
      url: "https://server.supabase.co",
      serviceRoleKey: "service-role-key",
    });
  });

  it("rejects service-role access in a browser-like runtime", () => {
    vi.stubGlobal("window", {});
    process.env.SUPABASE_URL = "https://server.supabase.co";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-key";

    expect(() => getSupabaseServiceRoleConfig()).toThrow(
      "Service-role Supabase access must stay on the server.",
    );
  });
});

describe("upsertOrders", () => {
  it("upserts orders on the retailcrm_id conflict key", async () => {
    const upsert = vi.fn().mockResolvedValue({ error: null });
    const from = vi.fn().mockReturnValue({ upsert });

    await expect(
      upsertOrders(
        { from } as never,
        [
          {
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
            raw_json: { id: 90 },
            synced_at: "2026-04-10T12:00:00.000Z",
          },
        ],
      ),
    ).resolves.toBe(1);

    expect(from).toHaveBeenCalledWith("orders");
    expect(upsert).toHaveBeenCalledWith(
      [
        expect.objectContaining({
          retailcrm_id: 90,
          currency: "KZT",
        }),
      ],
      { onConflict: "retailcrm_id" },
    );
  });
});

describe("readSyncState", () => {
  it("reads the persisted sync state payload by key", async () => {
    const maybeSingle = vi.fn().mockResolvedValue({
      data: {
        value: {
          completedAt: "2026-04-10T12:00:00.000Z",
        },
      },
      error: null,
    });
    const eq = vi.fn().mockReturnValue({ maybeSingle });
    const select = vi.fn().mockReturnValue({ eq });
    const from = vi.fn().mockReturnValue({ select });

    await expect(readSyncState({ from } as never, "retailcrm_orders_sync")).resolves.toEqual({
      completedAt: "2026-04-10T12:00:00.000Z",
    });

    expect(from).toHaveBeenCalledWith("sync_state");
    expect(select).toHaveBeenCalledWith("value");
    expect(eq).toHaveBeenCalledWith("key", "retailcrm_orders_sync");
  });
});

describe("writeSyncState", () => {
  it("persists the sync state under the provided sync_state key", async () => {
    const upsert = vi.fn().mockResolvedValue({ error: null });
    const from = vi.fn().mockReturnValue({ upsert });

    await expect(
      writeSyncState({ from } as never, {
        key: "retailcrm_orders_sync",
        updatedAt: "2026-04-10T12:00:00.000Z",
        value: {
          completedAt: "2026-04-10T12:00:00.000Z",
        },
      }),
    ).resolves.toBeUndefined();

    expect(from).toHaveBeenCalledWith("sync_state");
    expect(upsert).toHaveBeenCalledWith(
      {
        key: "retailcrm_orders_sync",
        updated_at: "2026-04-10T12:00:00.000Z",
        value: {
          completedAt: "2026-04-10T12:00:00.000Z",
        },
      },
      { onConflict: "key" },
    );
  });
});

describe("getUnalertedHighValueOrders", () => {
  it("returns only stored KZT orders above the threshold that are not already alerted", async () => {
    const alertsIn = vi.fn().mockResolvedValue({
      data: [{ retailcrm_id: 90 }],
      error: null,
    });
    const alertsSelect = vi.fn().mockReturnValue({ in: alertsIn });
    const ordersOrderByRetailCrmId = vi.fn().mockResolvedValue({
      data: [
        {
          retailcrm_id: 90,
          number: "MOCK-0050",
          created_at: "2026-02-19T09:00:00.000Z",
          status: "offer-analog",
          customer_name: "Феруза Юсупова",
          phone: "+77090123450",
          total_sum: 81000,
          currency: "KZT",
          source: "shopping-cart",
          raw_json: {
            delivery: {
              address: {
                city: "Шымкент",
              },
            },
            items: [],
          },
        },
        {
          retailcrm_id: 91,
          number: "MOCK-0051",
          created_at: "2026-02-20T10:30:00.000Z",
          status: "new",
          customer_name: "Айгерим Саттарова",
          phone: "+77090123451",
          total_sum: 91000,
          currency: "KZT",
          source: "instagram",
          raw_json: {
            delivery: {
              address: {
                city: "Алматы",
              },
            },
            items: [],
          },
        },
      ],
      error: null,
    });
    const ordersOrderByCreatedAt = vi.fn().mockReturnValue({
      order: ordersOrderByRetailCrmId,
    });
    const ordersGt = vi.fn().mockReturnValue({
      order: ordersOrderByCreatedAt,
    });
    const ordersEq = vi.fn().mockReturnValue({ gt: ordersGt });
    const ordersSelect = vi.fn().mockReturnValue({ eq: ordersEq });
    const from = vi.fn((table: string) => {
      if (table === "orders") {
        return { select: ordersSelect };
      }

      if (table === "alerts_sent") {
        return { select: alertsSelect };
      }

      throw new Error(`Unexpected table: ${table}`);
    });

    await expect(getUnalertedHighValueOrders({ from } as never, 50000)).resolves.toEqual([
      {
        retailcrm_id: 91,
        number: "MOCK-0051",
        created_at: "2026-02-20T10:30:00.000Z",
        status: "new",
        customer_name: "Айгерим Саттарова",
        phone: "+77090123451",
        total_sum: 91000,
        currency: "KZT",
        source: "instagram",
        raw_json: {
          delivery: {
            address: {
              city: "Алматы",
            },
          },
          items: [],
        },
      },
    ]);

    expect(from).toHaveBeenCalledWith("orders");
    expect(ordersSelect).toHaveBeenCalledWith(
      "retailcrm_id, number, created_at, status, customer_name, phone, total_sum, currency, source, raw_json",
    );
    expect(ordersEq).toHaveBeenCalledWith("currency", "KZT");
    expect(ordersGt).toHaveBeenCalledWith("total_sum", 50000);
    expect(ordersOrderByCreatedAt).toHaveBeenCalledWith("created_at", {
      ascending: true,
    });
    expect(ordersOrderByRetailCrmId).toHaveBeenCalledWith("retailcrm_id", {
      ascending: true,
    });
    expect(from).toHaveBeenCalledWith("alerts_sent");
    expect(alertsSelect).toHaveBeenCalledWith("retailcrm_id");
    expect(alertsIn).toHaveBeenCalledWith("retailcrm_id", [90, 91]);
  });

  it("does not query alerts_sent when no qualifying orders exist", async () => {
    const ordersOrderByRetailCrmId = vi.fn().mockResolvedValue({
      data: [],
      error: null,
    });
    const ordersOrderByCreatedAt = vi.fn().mockReturnValue({
      order: ordersOrderByRetailCrmId,
    });
    const ordersGt = vi.fn().mockReturnValue({
      order: ordersOrderByCreatedAt,
    });
    const ordersEq = vi.fn().mockReturnValue({ gt: ordersGt });
    const ordersSelect = vi.fn().mockReturnValue({ eq: ordersEq });
    const from = vi.fn((table: string) => {
      if (table === "orders") {
        return { select: ordersSelect };
      }

      throw new Error(`Unexpected table: ${table}`);
    });

    await expect(getUnalertedHighValueOrders({ from } as never, 50000)).resolves.toEqual([]);

    expect(from).toHaveBeenCalledTimes(1);
    expect(from).toHaveBeenCalledWith("orders");
  });
});

describe("markAlertSent", () => {
  it("upserts the alert dedupe record by retailcrm_id", async () => {
    const upsert = vi.fn().mockResolvedValue({ error: null });
    const from = vi.fn().mockReturnValue({ upsert });

    await expect(
      markAlertSent({ from } as never, {
        retailcrmId: 90,
        sentAt: "2026-04-10T16:00:00.000Z",
      }),
    ).resolves.toBeUndefined();

    expect(from).toHaveBeenCalledWith("alerts_sent");
    expect(upsert).toHaveBeenCalledWith(
      {
        retailcrm_id: 90,
        sent_at: "2026-04-10T16:00:00.000Z",
      },
      { onConflict: "retailcrm_id" },
    );
  });
});
