import type { RetailCrmOrderRecord } from "@/lib/retailcrm";
import type { SupabaseOrderRow } from "@/lib/supabase";

export const RETAILCRM_ORDERS_SYNC_STATE_KEY = "retailcrm_orders_sync";
export const RETAILCRM_SYNC_PAGE_SIZE = 50;

export type RetailCrmOrdersSyncState = {
  completedAt: string;
  cursor: {
    latestCreatedAt: string | null;
    latestRetailCrmId: number | null;
    mode: "full-scan";
    pageSize: number;
    site: string;
  };
  stats: {
    fetchedOrders: number;
    pagesProcessed: number;
    upsertedOrders: number;
  };
  syncKey: typeof RETAILCRM_ORDERS_SYNC_STATE_KEY;
};

function normalizeFiniteNumber(value: number | string, fieldName: string): number {
  const normalized = typeof value === "number" ? value : Number(value);

  if (!Number.isFinite(normalized)) {
    throw new Error(`RetailCRM order ${fieldName} must be a finite number.`);
  }

  return normalized;
}

function readRequiredString(value: string | undefined, fieldName: string): string {
  if (!value) {
    throw new Error(`RetailCRM order ${fieldName} is required for sync.`);
  }

  return value;
}

function extractCustomerName(order: RetailCrmOrderRecord): string | null {
  const name = [order.firstName, order.lastName].filter(Boolean).join(" ").trim();

  return name.length > 0 ? name : null;
}

function extractSource(order: RetailCrmOrderRecord): string | null {
  const utmSource = order.customFields?.utm_source;

  if (typeof utmSource === "string" && utmSource.trim().length > 0) {
    return utmSource.trim();
  }

  if (typeof order.orderMethod === "string" && order.orderMethod.trim().length > 0) {
    return order.orderMethod.trim();
  }

  return null;
}

export function normalizeRetailCrmTimestamp(value: string): string {
  const retailCrmMatch = value.match(
    /^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})$/,
  );

  if (retailCrmMatch) {
    const [, year, month, day, hours, minutes, seconds] = retailCrmMatch;
    const isoValue = new Date(
      Date.UTC(
        Number(year),
        Number(month) - 1,
        Number(day),
        Number(hours),
        Number(minutes),
        Number(seconds),
      ),
    ).toISOString();

    return isoValue;
  }

  if (/^\d{4}-\d{2}-\d{2}T.*(?:Z|[+-]\d{2}:\d{2})$/.test(value)) {
    const parsed = new Date(value);

    if (Number.isNaN(parsed.getTime())) {
      throw new Error("RetailCRM order createdAt is not a valid timestamp.");
    }

    return parsed.toISOString();
  }

  throw new Error("RetailCRM order createdAt must use a deterministic timestamp format.");
}

export function mapRetailCrmOrderToSupabaseOrder(
  order: RetailCrmOrderRecord,
  syncedAt: string,
): SupabaseOrderRow {
  return {
    retailcrm_id: normalizeFiniteNumber(order.id, "id"),
    external_id: order.externalId ?? null,
    number: order.number ?? null,
    created_at: normalizeRetailCrmTimestamp(order.createdAt),
    status: order.status ?? null,
    customer_name: extractCustomerName(order),
    phone: order.phone ?? null,
    total_sum: normalizeFiniteNumber(order.totalSumm, "totalSumm"),
    currency: readRequiredString(order.currency, "currency"),
    source: extractSource(order),
    raw_json: order,
    synced_at: syncedAt,
  };
}

export function buildRetailCrmOrdersSyncState(input: {
  completedAt: string;
  fetchedOrders: number;
  latestCreatedAt: string | null;
  latestRetailCrmId: number | null;
  pagesProcessed: number;
  site: string;
  upsertedOrders: number;
}): RetailCrmOrdersSyncState {
  return {
    completedAt: input.completedAt,
    cursor: {
      latestCreatedAt: input.latestCreatedAt,
      latestRetailCrmId: input.latestRetailCrmId,
      mode: "full-scan",
      pageSize: RETAILCRM_SYNC_PAGE_SIZE,
      site: input.site,
    },
    stats: {
      fetchedOrders: input.fetchedOrders,
      pagesProcessed: input.pagesProcessed,
      upsertedOrders: input.upsertedOrders,
    },
    syncKey: RETAILCRM_ORDERS_SYNC_STATE_KEY,
  };
}
