import { readFile } from "node:fs/promises";
import path from "node:path";

import {
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

async function main() {
  const filePath = path.join(process.cwd(), "mock_orders.json");
  const fixtureOrders = await readMockOrders(filePath);
  const sites = await listRetailCrmSites();
  const orderTypes = await listRetailCrmOrderTypes();
  const orders = fixtureOrders.map((order, index) =>
    buildRetailCrmOrder(order, index, {
      orderType: resolveRetailCrmOrderTypeCode(orderTypes, order.orderType),
    }),
  );
  const siteCode = selectRetailCrmSiteCode(sites, process.env.RETAILCRM_SITE_CODE);
  const result = await uploadRetailCrmOrders({
    orders,
    site: siteCode,
  });

  console.log("RetailCRM import completed.");
  console.log(`Fixture path: ${filePath}`);
  console.log(`Resolved site: ${siteCode}`);
  console.log(`Prepared orders: ${orders.length}`);
  console.log(`Uploaded orders: ${result.uploadedOrders?.length ?? orders.length}`);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Unknown import failure.";

  console.error("RetailCRM import failed.");
  console.error(message);

  process.exitCode = 1;
});
