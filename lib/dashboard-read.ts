import {
  RETAILCRM_ORDERS_SYNC_STATE_KEY,
  type RetailCrmOrdersSyncState,
} from "@/lib/retailcrm-sync";
import { buildDashboardReadModel, type DashboardOrderRow } from "@/lib/dashboard";
import { createServiceRoleSupabaseClient, readSyncState } from "@/lib/supabase";

function readLastSyncedAt(input: {
  orders: DashboardOrderRow[];
  syncState: RetailCrmOrdersSyncState | null;
}): string | null {
  const completedAt = input.syncState?.completedAt;

  if (typeof completedAt === "string" && completedAt.length > 0) {
    return completedAt;
  }

  return input.orders[0]?.synced_at ?? null;
}

export async function readDashboardReadModel() {
  const supabase = createServiceRoleSupabaseClient();
  const [{ data, error }, syncState] = await Promise.all([
    supabase
      .from("orders")
      .select(
        "retailcrm_id, external_id, number, created_at, status, customer_name, phone, total_sum, currency, source, synced_at, raw_json",
      )
      .order("created_at", { ascending: false })
      .order("retailcrm_id", { ascending: false }),
    readSyncState<RetailCrmOrdersSyncState>(supabase, RETAILCRM_ORDERS_SYNC_STATE_KEY),
  ]);

  if (error) {
    throw new Error(error.message || "Supabase dashboard query failed.");
  }

  const orders = (data ?? []) as DashboardOrderRow[];

  return buildDashboardReadModel({
    lastSyncedAt: readLastSyncedAt({
      orders,
      syncState,
    }),
    orders,
  });
}
