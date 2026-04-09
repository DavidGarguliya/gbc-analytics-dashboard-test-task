import { readFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

import {
  isRetailCrmDuplicateExternalIdError,
  listRetailCrmOrderTypes,
  listRetailCrmSites,
  selectRetailCrmSiteCode,
  uploadRetailCrmOrders,
} from "@/lib/retailcrm";
import {
  buildRetailCrmOrder,
  parseMockOrdersFixture,
  resolveRetailCrmOrderTypeCode,
  type MockOrderRecord,
} from "@/lib/retailcrm-import";

async function readMockOrders(filePath: string): Promise<MockOrderRecord[]> {
  const raw = await readFile(filePath, "utf8");
  const parsed = JSON.parse(raw) as unknown;

  return parseMockOrdersFixture(parsed);
}

export type RetailCrmImportRunResult = {
  fixturePath: string;
  outcome: "duplicate-safe-rejected" | "uploaded";
  preparedOrders: number;
  resolvedCurrency: string;
  resolvedSite: string;
  uploadedOrders: number;
};

export async function runRetailCrmImport(): Promise<RetailCrmImportRunResult> {
  const filePath = path.join(process.cwd(), "mock_orders.json");
  const fixtureOrders = await readMockOrders(filePath);
  const sites = await listRetailCrmSites();
  const siteCode = selectRetailCrmSiteCode(sites, process.env.RETAILCRM_SITE_CODE);
  const selectedSite = sites.find((site) => site.code === siteCode);
  const orderTypes = await listRetailCrmOrderTypes();
  const orders = fixtureOrders.map((order, index) =>
    buildRetailCrmOrder(order, index, {
      currency: selectedSite?.currency,
      orderType: resolveRetailCrmOrderTypeCode(orderTypes, order.orderType),
    }),
  );

  try {
    const result = await uploadRetailCrmOrders({
      orders,
      site: siteCode,
    });

    return {
      fixturePath: filePath,
      outcome: "uploaded",
      preparedOrders: orders.length,
      resolvedCurrency: selectedSite?.currency ?? "KZT",
      resolvedSite: siteCode,
      uploadedOrders: result.uploadedOrders?.length ?? orders.length,
    };
  } catch (error) {
    if (!isRetailCrmDuplicateExternalIdError(error)) {
      throw error;
    }

    return {
      fixturePath: filePath,
      outcome: "duplicate-safe-rejected",
      preparedOrders: orders.length,
      resolvedCurrency: selectedSite?.currency ?? "KZT",
      resolvedSite: siteCode,
      uploadedOrders: 0,
    };
  }
}

export function logRetailCrmImportResult(
  result: RetailCrmImportRunResult,
  logger: Pick<Console, "log"> = console,
) {
  logger.log("RetailCRM import completed.");
  logger.log(`Fixture path: ${result.fixturePath}`);
  logger.log(`Resolved site: ${result.resolvedSite}`);
  logger.log(`Resolved currency: ${result.resolvedCurrency}`);
  logger.log(`Prepared orders: ${result.preparedOrders}`);
  logger.log(`Uploaded orders: ${result.uploadedOrders}`);

  if (result.outcome === "duplicate-safe-rejected") {
    logger.log("Upload outcome: duplicate-safe externalId rejection.");
  }
}

async function main() {
  const result = await runRetailCrmImport();

  logRetailCrmImportResult(result);
}

const isDirectExecution =
  typeof process.argv[1] === "string" &&
  import.meta.url === pathToFileURL(process.argv[1]).href;

if (isDirectExecution) {
  main().catch((error: unknown) => {
    const message = error instanceof Error ? error.message : "Unknown import failure.";

    console.error("RetailCRM import failed.");
    console.error(message);

    process.exitCode = 1;
  });
}
