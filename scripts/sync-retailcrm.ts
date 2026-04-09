import {
  listRetailCrmOrdersPage,
  listRetailCrmSites,
  selectRetailCrmSiteCode,
} from "@/lib/retailcrm";
import {
  RETAILCRM_ORDERS_SYNC_STATE_KEY,
  RETAILCRM_SYNC_PAGE_SIZE,
  buildRetailCrmOrdersSyncState,
  mapRetailCrmOrderToSupabaseOrder,
  type RetailCrmOrdersSyncState,
} from "@/lib/retailcrm-sync";
import {
  createServiceRoleSupabaseClient,
  readSyncState,
  upsertOrders,
  writeSyncState,
} from "@/lib/supabase";

async function main() {
  const supabase = createServiceRoleSupabaseClient();
  const sites = await listRetailCrmSites();
  const siteCode = selectRetailCrmSiteCode(sites, process.env.RETAILCRM_SITE_CODE);
  const previousState = await readSyncState<RetailCrmOrdersSyncState>(
    supabase,
    RETAILCRM_ORDERS_SYNC_STATE_KEY,
  );
  const completedAt = new Date().toISOString();
  let currentPage = 1;
  let totalPages = 1;
  let fetchedOrders = 0;
  let upsertedOrders = 0;
  let latestRetailCrmId: number | null = null;
  let latestCreatedAt: string | null = null;

  do {
    const page = await listRetailCrmOrdersPage({
      limit: RETAILCRM_SYNC_PAGE_SIZE,
      page: currentPage,
      site: siteCode,
    });
    const rows = page.orders.map((order) =>
      mapRetailCrmOrderToSupabaseOrder(order, completedAt),
    );

    totalPages = page.pagination.totalPageCount;
    fetchedOrders += page.orders.length;
    upsertedOrders += await upsertOrders(supabase, rows);

    for (const row of rows) {
      if (latestRetailCrmId === null || row.retailcrm_id > latestRetailCrmId) {
        latestRetailCrmId = row.retailcrm_id;
      }

      if (latestCreatedAt === null || row.created_at > latestCreatedAt) {
        latestCreatedAt = row.created_at;
      }
    }

    currentPage += 1;
  } while (currentPage <= totalPages);

  const syncState = buildRetailCrmOrdersSyncState({
    completedAt,
    fetchedOrders,
    latestCreatedAt,
    latestRetailCrmId,
    pagesProcessed: totalPages,
    site: siteCode,
    upsertedOrders,
  });

  await writeSyncState(supabase, {
    key: RETAILCRM_ORDERS_SYNC_STATE_KEY,
    updatedAt: completedAt,
    value: syncState,
  });

  console.log("RetailCRM sync completed.");
  console.log(`Resolved site: ${siteCode}`);
  console.log(`Page size: ${RETAILCRM_SYNC_PAGE_SIZE}`);
  console.log(`Pages processed: ${totalPages}`);
  console.log(`Orders fetched: ${fetchedOrders}`);
  console.log(`Orders upserted: ${upsertedOrders}`);
  console.log(`Latest RetailCRM id: ${latestRetailCrmId ?? "n/a"}`);
  console.log(`Latest createdAt: ${latestCreatedAt ?? "n/a"}`);
  console.log(`Sync state key: ${RETAILCRM_ORDERS_SYNC_STATE_KEY}`);

  if (previousState) {
    console.log(`Previous sync completed at: ${previousState.completedAt}`);
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Unknown sync failure.";

  console.error("RetailCRM sync failed.");
  console.error(message);

  process.exitCode = 1;
});
