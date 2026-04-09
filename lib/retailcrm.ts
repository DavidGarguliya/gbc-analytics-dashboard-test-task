import { readRequiredEnv } from "@/lib/env";
import type { RetailCrmSerializedOrder } from "@/lib/retailcrm-import";

const RETAIL_CRM_API_VERSION = "v5";

export type RetailCrmSite = {
  code: string;
  defaultForCrm?: boolean;
};

type RetailCrmSitePayload = RetailCrmSite & Record<string, unknown>;

type RetailCrmSitesResponse = {
  sites?: RetailCrmSitePayload[] | Record<string, RetailCrmSitePayload>;
  success: boolean;
};

type RetailCrmOrderType = {
  code: string;
  defaultForCrm?: boolean;
};

type RetailCrmOrderTypePayload = RetailCrmOrderType & Record<string, unknown>;

type RetailCrmOrderTypesResponse = {
  orderTypes?: RetailCrmOrderTypePayload[] | Record<string, RetailCrmOrderTypePayload>;
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

function sanitizeRetailCrmBaseUrl(baseUrl: string): string {
  return baseUrl.replace(/\/+$/, "");
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

function normalizeRetailCrmSites(
  sites: RetailCrmSitesResponse["sites"],
): RetailCrmSite[] {
  if (!sites) {
    return [];
  }

  if (Array.isArray(sites)) {
    return sites.map((site) => ({
      code: site.code,
      defaultForCrm: site.defaultForCrm,
    }));
  }

  return Object.values(sites).map((site) => ({
    code: site.code,
    defaultForCrm: site.defaultForCrm,
  }));
}

function normalizeRetailCrmOrderTypes(
  orderTypes: RetailCrmOrderTypesResponse["orderTypes"],
): RetailCrmOrderType[] {
  if (!orderTypes) {
    return [];
  }

  if (Array.isArray(orderTypes)) {
    return orderTypes.map((orderType) => ({
      code: orderType.code,
      defaultForCrm: orderType.defaultForCrm,
    }));
  }

  return Object.values(orderTypes).map((orderType) => ({
    code: orderType.code,
    defaultForCrm: orderType.defaultForCrm,
  }));
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

  const sites = normalizeRetailCrmSites(payload.sites);

  if (sites.length === 0) {
    throw new RetailCrmApiError(
      "RetailCRM did not return the sites list.",
      response.status,
      payload,
    );
  }

  return sites;
}

export async function listRetailCrmOrderTypes(): Promise<RetailCrmOrderType[]> {
  const response = await fetch(buildRetailCrmApiUrl("/reference/order-types"));
  const payload = await parseRetailCrmResponse<RetailCrmOrderTypesResponse>(response);

  if (!payload.success || !payload.orderTypes) {
    throw new RetailCrmApiError(
      "RetailCRM did not return the order types list.",
      response.status,
      payload,
    );
  }

  const orderTypes = normalizeRetailCrmOrderTypes(payload.orderTypes);

  if (orderTypes.length === 0) {
    throw new RetailCrmApiError(
      "RetailCRM did not return the order types list.",
      response.status,
      payload,
    );
  }

  return orderTypes;
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
