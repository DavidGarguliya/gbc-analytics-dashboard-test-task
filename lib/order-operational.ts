export const OPERATIONAL_FALLBACK_LABEL = "Не указан";

export type OperationalOrderRecord = {
  created_at: string;
  currency: string;
  customer_name?: string | null;
  external_id?: string | null;
  number?: string | null;
  phone?: string | null;
  raw_json: Record<string, unknown>;
  retailcrm_id: number;
  source?: string | null;
  status?: string | null;
  total_sum: number;
};

export type OperationalOrderItem = {
  lineTotal: number | null;
  productName: string;
  quantity: number | null;
  unitPrice: number | null;
};

export type OperationalOrderSummary = {
  createdAt: string;
  currency: string;
  customerName: string | null;
  city: string | null;
  email: string | null;
  externalId: string | null;
  itemCount: number;
  items: OperationalOrderItem[];
  number: string | null;
  phone: string | null;
  retailcrmId: number;
  sourceLabel: string;
  status: string | null;
  totalSum: number;
  unitsCount: number | null;
};

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function normalizeFiniteNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim().length > 0) {
    const normalized = Number(value);

    return Number.isFinite(normalized) ? normalized : null;
  }

  return null;
}

function readTrimmedString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();

  return normalized.length > 0 ? normalized : null;
}

function formatSourceLabel(rawSource: string | null): string {
  if (rawSource === "shopping-cart") {
    return "Через корзину";
  }

  if (rawSource === "offerr-analog") {
    return "Предложить замену";
  }

  return rawSource ?? OPERATIONAL_FALLBACK_LABEL;
}

function formatStatusLabel(rawStatus: string | null): string | null {
  if (rawStatus === "offer-analog" || rawStatus === "offerr-analog") {
    return "Предложить замену";
  }
  return rawStatus;
}

function roundValue(value: number): number {
  return Math.round(value * 100) / 100;
}

function readFallbackCustomerName(rawJson: Record<string, unknown>): string | null {
  const firstName = readTrimmedString(rawJson.firstName);
  const lastName = readTrimmedString(rawJson.lastName);
  const name = [firstName, lastName].filter(Boolean).join(" ").trim();

  return name.length > 0 ? name : null;
}

function readFallbackSource(rawJson: Record<string, unknown>): string | null {
  const customFields = rawJson.customFields;

  if (isObject(customFields)) {
    const utmSource = readTrimmedString(customFields.utm_source);

    if (utmSource !== null) {
      return utmSource;
    }
  }

  return readTrimmedString(rawJson.orderMethod);
}

function readDeliveryCity(rawJson: Record<string, unknown>): string | null {
  const delivery = rawJson.delivery;

  if (!isObject(delivery)) {
    return null;
  }

  const address = delivery.address;

  if (!isObject(address)) {
    return null;
  }

  return readTrimmedString(address.city);
}

function readEmail(rawJson: Record<string, unknown>): string | null {
  return readTrimmedString(rawJson.email);
}

function readOfferProductName(item: Record<string, unknown>): string | null {
  const offer = item.offer;

  if (!isObject(offer)) {
    return null;
  }

  return (
    readTrimmedString(offer.displayName) ??
    readTrimmedString(offer.name)
  );
}

export function readOperationalOrderItems(
  rawJson: Record<string, unknown>,
): OperationalOrderItem[] {
  const candidateItems = rawJson.items;

  if (!Array.isArray(candidateItems)) {
    return [];
  }

  return candidateItems.filter(isObject).map((item, index) => {
    const quantity = normalizeFiniteNumber(item.quantity);
    const unitPrice = normalizeFiniteNumber(item.initialPrice);

    return {
      lineTotal:
        quantity !== null && unitPrice !== null ? roundValue(quantity * unitPrice) : null,
      productName:
        readTrimmedString(item.productName) ??
        readOfferProductName(item) ??
        `Позиция ${index + 1}`,
      quantity,
      unitPrice,
    };
  });
}

export function readOperationalUnitsCount(items: readonly OperationalOrderItem[]): number | null {
  if (items.length === 0) {
    return 0;
  }

  if (items.some((item) => item.quantity === null)) {
    return null;
  }

  return roundValue(
    items.reduce((sum, item) => sum + (item.quantity ?? 0), 0),
  );
}

export function buildOperationalOrderSummary(
  record: OperationalOrderRecord,
): OperationalOrderSummary {
  const items = readOperationalOrderItems(record.raw_json);

  return {
    createdAt: record.created_at,
    currency: record.currency,
    customerName:
      readTrimmedString(record.customer_name) ?? readFallbackCustomerName(record.raw_json),
    city: readDeliveryCity(record.raw_json),
    email: readEmail(record.raw_json),
    externalId:
      readTrimmedString(record.external_id) ?? readTrimmedString(record.raw_json.externalId),
    itemCount: items.length,
    items,
    number: readTrimmedString(record.number) ?? readTrimmedString(record.raw_json.number),
    phone: readTrimmedString(record.phone) ?? readTrimmedString(record.raw_json.phone),
    retailcrmId: record.retailcrm_id,
    sourceLabel: formatSourceLabel(
      readTrimmedString(record.source) ?? readFallbackSource(record.raw_json)
    ),
    status: formatStatusLabel(readTrimmedString(record.status)),
    totalSum: Number(record.total_sum),
    unitsCount: readOperationalUnitsCount(items),
  };
}

export function formatOperationalOrderLabel(input: {
  number: string | null;
  retailcrmId: number;
}): string {
  return input.number ?? `#${input.retailcrmId}`;
}

export function splitOperationalItems(
  items: readonly OperationalOrderItem[],
  limit: number,
): {
  hiddenCount: number;
  visibleItems: OperationalOrderItem[];
} {
  if (limit <= 0) {
    return {
      hiddenCount: items.length,
      visibleItems: [],
    };
  }

  return {
    hiddenCount: Math.max(0, items.length - limit),
    visibleItems: items.slice(0, limit),
  };
}
