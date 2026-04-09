import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { readRequiredEnv } from "@/lib/env";

export type SupabaseBrowserConfig = {
  anonKey: string;
  url: string;
};

export type SupabaseServiceRoleConfig = {
  serviceRoleKey: string;
  url: string;
};

export type SupabaseOrderRow = {
  created_at: string;
  currency: string;
  customer_name: string | null;
  external_id: string | null;
  number: string | null;
  phone: string | null;
  raw_json: Record<string, unknown>;
  retailcrm_id: number;
  source: string | null;
  status: string | null;
  synced_at: string;
  total_sum: number;
};

export type SupabaseHighValueOrderRow = {
  created_at: string;
  currency: string;
  number: string | null;
  retailcrm_id: number;
  status: string | null;
  total_sum: number;
};

type SupabaseErrorResult = {
  error: {
    message?: string;
  } | null;
};

type SupabaseSyncStateSelectResult<T> = {
  data: {
    value: T;
  } | null;
  error: {
    message?: string;
  } | null;
};

type SupabaseSelectRowsResult<T> = {
  data: T[] | null;
  error: {
    message?: string;
  } | null;
};

function assertServerRuntime() {
  if (typeof window !== "undefined") {
    throw new Error("Service-role Supabase access must stay on the server.");
  }
}

function assertSupabaseSuccess(
  operation: string,
  result: SupabaseErrorResult,
): void {
  if (result.error) {
    throw new Error(result.error.message ?? `Supabase ${operation} failed.`);
  }
}

export function getSupabaseBrowserConfig(): SupabaseBrowserConfig {
  return {
    url: readRequiredEnv("NEXT_PUBLIC_SUPABASE_URL"),
    anonKey: readRequiredEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  };
}

export function getSupabaseServiceRoleConfig(): SupabaseServiceRoleConfig {
  assertServerRuntime();

  return {
    url: readRequiredEnv("SUPABASE_URL"),
    serviceRoleKey: readRequiredEnv("SUPABASE_SERVICE_ROLE_KEY"),
  };
}

export function createBrowserSupabaseClient(): SupabaseClient {
  const config = getSupabaseBrowserConfig();

  return createClient(config.url, config.anonKey);
}

export function createServiceRoleSupabaseClient(): SupabaseClient {
  const config = getSupabaseServiceRoleConfig();

  return createClient(config.url, config.serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export async function upsertOrders(
  client: SupabaseClient,
  rows: SupabaseOrderRow[],
): Promise<number> {
  if (rows.length === 0) {
    return 0;
  }

  const result = (await client.from("orders").upsert(rows, {
    onConflict: "retailcrm_id",
  })) as SupabaseErrorResult;

  assertSupabaseSuccess("orders upsert", result);

  return rows.length;
}

export async function readSyncState<T extends Record<string, unknown>>(
  client: SupabaseClient,
  key: string,
): Promise<T | null> {
  const result = (await client
    .from("sync_state")
    .select("value")
    .eq("key", key)
    .maybeSingle()) as SupabaseSyncStateSelectResult<T>;

  assertSupabaseSuccess("sync_state read", result);

  return result.data?.value ?? null;
}

export async function writeSyncState(
  client: SupabaseClient,
  input: {
    key: string;
    updatedAt: string;
    value: Record<string, unknown>;
  },
): Promise<void> {
  const result = (await client.from("sync_state").upsert({
    key: input.key,
    updated_at: input.updatedAt,
    value: input.value,
  }, {
    onConflict: "key",
  })) as SupabaseErrorResult;

  assertSupabaseSuccess("sync_state upsert", result);
}

export async function getUnalertedHighValueOrders(
  client: SupabaseClient,
  threshold: number,
): Promise<SupabaseHighValueOrderRow[]> {
  const ordersResult = (await client
    .from("orders")
    .select("retailcrm_id, number, created_at, status, total_sum, currency")
    .eq("currency", "KZT")
    .gt("total_sum", threshold)
    .order("created_at", {
      ascending: true,
    })
    .order("retailcrm_id", {
      ascending: true,
    })) as SupabaseSelectRowsResult<SupabaseHighValueOrderRow>;

  assertSupabaseSuccess("high-value orders read", ordersResult);

  const qualifyingOrders = ordersResult.data ?? [];

  if (qualifyingOrders.length === 0) {
    return [];
  }

  const alertsResult = (await client
    .from("alerts_sent")
    .select("retailcrm_id")
    .in(
      "retailcrm_id",
      qualifyingOrders.map((order) => order.retailcrm_id),
    )) as SupabaseSelectRowsResult<Pick<SupabaseHighValueOrderRow, "retailcrm_id">>;

  assertSupabaseSuccess("alerts_sent read", alertsResult);

  const alertedIds = new Set(
    (alertsResult.data ?? []).map((record) => record.retailcrm_id),
  );

  return qualifyingOrders.filter((order) => !alertedIds.has(order.retailcrm_id));
}

export async function markAlertSent(
  client: SupabaseClient,
  input: {
    retailcrmId: number;
    sentAt: string;
  },
): Promise<void> {
  const result = (await client.from("alerts_sent").upsert(
    {
      retailcrm_id: input.retailcrmId,
      sent_at: input.sentAt,
    },
    {
      onConflict: "retailcrm_id",
    },
  )) as SupabaseErrorResult;

  assertSupabaseSuccess("alerts_sent upsert", result);
}
