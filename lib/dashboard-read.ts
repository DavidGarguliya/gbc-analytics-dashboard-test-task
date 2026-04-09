import { buildDashboardReadModel, type DashboardOrderRow } from "@/lib/dashboard";
import { createServiceRoleSupabaseClient } from "@/lib/supabase";

export async function readDashboardReadModel() {
  const supabase = createServiceRoleSupabaseClient();
  const { data, error } = await supabase
    .from("orders")
    .select(
      "retailcrm_id, external_id, number, created_at, status, total_sum, currency, source, synced_at",
    )
    .order("created_at", { ascending: false })
    .order("retailcrm_id", { ascending: false });

  if (error) {
    throw new Error(error.message || "Supabase dashboard query failed.");
  }

  return buildDashboardReadModel((data ?? []) as DashboardOrderRow[]);
}
