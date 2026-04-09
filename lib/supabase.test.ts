import { afterEach, describe, expect, it, vi } from "vitest";

import {
  getSupabaseBrowserConfig,
  getSupabaseServiceRoleConfig,
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
