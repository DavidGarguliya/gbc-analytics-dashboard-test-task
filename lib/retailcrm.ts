import { readRequiredEnv } from "@/lib/env";

const RETAIL_CRM_API_VERSION = "v5";

export type MockOrderItem = {
  initialPrice: number;
  productName: string;
  quantity: number;
};

export type MockOrderRecord = {
  customFields?: Record<string, unknown>;
  delivery: {
    address: {
      city: string;
      text: string;
    };
  };
  email?: string;
  firstName: string;
  items: MockOrderItem[];
  lastName: string;
  orderMethod: string;
  orderType: string;
  phone: string;
  status: string;
};

export type RetailCrmSite = {
  code: string;
  defaultForCrm?: boolean;
};

export type RetailCrmSerializedOrder = {
  createdAt: string;
  currency: "KZT";
  customFields?: Record<string, unknown>;
  delivery: MockOrderRecord["delivery"];
  email?: string;
  externalId: string;
  firstName: string;
  items: MockOrderItem[];
  lastName: string;
  number: string;
  orderMethod: string;
  orderType: string;
  phone: string;
  status: string;
};

type RetailCrmSitesResponse = {
  sites?: RetailCrmSite[];
  success: boolean;
};

type RetailCrmUploadResponse = {
  errorMsg?: string;
  errors?: string[];
  success: boolean;
  uploadedOrders?: Array<{
    externalId?: string;
    id?: number;
  }>;
};

export class RetailCrmApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = "RetailCrmApiError";
  }
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isMockOrderItem(value: unknown): value is MockOrderItem {
  return (
    isObject(value) &&
    typeof value.productName === "string" &&
    typeof value.quantity === "number" &&
    typeof value.initialPrice === "number"
  );
}

function isMockOrderRecord(value: unknown): value is MockOrderRecord {
  return (
    isObject(value) &&
    typeof value.firstName === "string" &&
    typeof value.lastName === "string" &&
    typeof value.phone === "string" &&
    (typeof value.email === "string" || typeof value.email === "undefined") &&
    typeof value.orderType === "string" &&
    typeof value.orderMethod === "string" &&
    typeof value.status === "string" &&
    Array.isArray(value.items) &&
    value.items.every(isMockOrderItem) &&
    isObject(value.delivery) &&
    isObject(value.delivery.address) &&
    typeof value.delivery.address.city === "string" &&
    typeof value.delivery.address.text === "string" &&
    (typeof value.customFields === "undefined" || isObject(value.customFields))
  );
}

function sanitizeRetailCrmBaseUrl(baseUrl: string): string {
  return baseUrl.replace(/\/+$/, "");
}

function formatImportTimestamp(index: number): string {
  const date = new Date(Date.UTC(2026, 0, 1 + index, 9, 0, 0));
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  const hours = String(date.getUTCHours()).padStart(2, "0");
  const minutes = String(date.getUTCMinutes()).padStart(2, "0");
  const seconds = String(date.getUTCSeconds()).padStart(2, "0");

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

function buildRetailCrmApiUrl(path: string, extraParams?: Record<string, string>): string {
  const url = new URL(
    `/api/${RETAIL_CRM_API_VERSION}${path}`,
    sanitizeRetailCrmBaseUrl(readRequiredEnv("RETAILCRM_BASE_URL")),
  );

  url.searchParams.set("apiKey", readRequiredEnv("RETAILCRM_API_KEY"));

  if (extraParams) {
    for (const [key, value] of Object.entries(extraParams)) {
      url.searchParams.set(key, value);
    }
  }

  return url.toString();
}

export function buildRetailCrmOrder(
  order: MockOrderRecord,
  index: number,
): RetailCrmSerializedOrder {
  const serial = String(index + 1).padStart(4, "0");

  return {
    createdAt: formatImportTimestamp(index),
    currency: "KZT",
    customFields: order.customFields,
    delivery: order.delivery,
    email: order.email,
    externalId: `mock-order-${serial}`,
    firstName: order.firstName,
    items: order.items.map((item) => ({
      initialPrice: item.initialPrice,
      productName: item.productName,
      quantity: item.quantity,
    })),
    lastName: order.lastName,
    number: `MOCK-${serial}`,
    orderMethod: order.orderMethod,
    orderType: order.orderType,
    phone: order.phone,
    status: order.status,
  };
}

export function parseMockOrdersFixture(input: unknown): MockOrderRecord[] {
  if (!Array.isArray(input)) {
    throw new Error("mock_orders.json must contain an array of orders.");
  }

  return input.map((entry, index) => {
    if (!isMockOrderRecord(entry)) {
      throw new Error(`mock_orders.json entry ${index + 1} has an invalid shape.`);
    }

    return entry;
  });
}

export function buildRetailCrmUploadBody(input: {
  apiKey: string;
  orders: RetailCrmSerializedOrder[];
  site: string;
}): URLSearchParams {
  const body = new URLSearchParams();

  body.set("apiKey", input.apiKey);
  body.set("site", input.site);
  body.set("orders", JSON.stringify(input.orders));

  return body;
}

export function selectRetailCrmSiteCode(
  sites: RetailCrmSite[],
  preferredSiteCode?: string,
): string {
  if (sites.length === 0) {
    throw new Error("RetailCRM did not return any accessible sites for the API key.");
  }

  if (preferredSiteCode) {
    const preferredSite = sites.find((site) => site.code === preferredSiteCode);

    if (!preferredSite) {
      throw new Error(`RetailCRM site "${preferredSiteCode}" is not available for the API key.`);
    }

    return preferredSite.code;
  }

  return sites.find((site) => site.defaultForCrm)?.code ?? sites[0].code;
}

async function parseRetailCrmResponse<T>(response: Response): Promise<T> {
  const payload = (await response.json()) as T;

  if (!response.ok) {
    throw new RetailCrmApiError("RetailCRM request failed.", response.status, payload);
  }

  return payload;
}

export async function listRetailCrmSites(): Promise<RetailCrmSite[]> {
  const response = await fetch(buildRetailCrmApiUrl("/reference/sites"));
  const payload = await parseRetailCrmResponse<RetailCrmSitesResponse>(response);

  if (!payload.success || !payload.sites) {
    throw new RetailCrmApiError(
      "RetailCRM did not return the sites list.",
      response.status,
      payload,
    );
  }

  return payload.sites;
}

export async function uploadRetailCrmOrders(input: {
  orders: RetailCrmSerializedOrder[];
  site: string;
}): Promise<RetailCrmUploadResponse> {
  const response = await fetch(buildRetailCrmApiUrl("/orders/upload"), {
    body: buildRetailCrmUploadBody({
      apiKey: readRequiredEnv("RETAILCRM_API_KEY"),
      orders: input.orders,
      site: input.site,
    }),
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    method: "POST",
  });

  const payload = await parseRetailCrmResponse<RetailCrmUploadResponse>(response);

  if (!payload.success) {
    throw new RetailCrmApiError(
      payload.errorMsg ?? "RetailCRM rejected the orders upload.",
      response.status,
      payload,
    );
  }

  return payload;
}
