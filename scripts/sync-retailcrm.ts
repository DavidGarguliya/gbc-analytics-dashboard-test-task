import { pathToFileURL } from "node:url";

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

export type RetailCrmSyncRunResult = {
  latestCreatedAt: string | null;
  latestRetailCrmId: number | null;
  ordersFetched: number;
  ordersUpserted: number;
  pageSize: number;
  pagesProcessed: number;
  previousCompletedAt: string | null;
  resolvedSite: string;
  syncStateKey: typeof RETAILCRM_ORDERS_SYNC_STATE_KEY;
};

export async function runRetailCrmSync(): Promise<RetailCrmSyncRunResult> {
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

  return {
    latestCreatedAt,
    latestRetailCrmId,
    ordersFetched: fetchedOrders,
    ordersUpserted: upsertedOrders,
    pageSize: RETAILCRM_SYNC_PAGE_SIZE,
    pagesProcessed: totalPages,
    previousCompletedAt: previousState?.completedAt ?? null,
    resolvedSite: siteCode,
    syncStateKey: RETAILCRM_ORDERS_SYNC_STATE_KEY,
  };
}

export function logRetailCrmSyncResult(
  result: RetailCrmSyncRunResult,
  logger: Pick<Console, "log"> = console,
) {
  logger.log("RetailCRM sync completed.");
  logger.log(`Resolved site: ${result.resolvedSite}`);
  logger.log(`Page size: ${result.pageSize}`);
  logger.log(`Pages processed: ${result.pagesProcessed}`);
  logger.log(`Orders fetched: ${result.ordersFetched}`);
  logger.log(`Orders upserted: ${result.ordersUpserted}`);
  logger.log(`Latest RetailCRM id: ${result.latestRetailCrmId ?? "n/a"}`);
  logger.log(`Latest createdAt: ${result.latestCreatedAt ?? "n/a"}`);
  logger.log(`Sync state key: ${result.syncStateKey}`);

  if (result.previousCompletedAt) {
    logger.log(`Previous sync completed at: ${result.previousCompletedAt}`);
  }
}

async function main() {
  const result = await runRetailCrmSync();

  logRetailCrmSyncResult(result);
}

const isDirectExecution =
  typeof process.argv[1] === "string" &&
  import.meta.url === pathToFileURL(process.argv[1]).href;

if (isDirectExecution) {
  main().catch((error: unknown) => {
    const message = error instanceof Error ? error.message : "Unknown sync failure.";

    console.error("RetailCRM sync failed.");
    console.error(message);

    process.exitCode = 1;
  });
}
