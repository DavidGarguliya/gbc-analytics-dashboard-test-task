import { pathToFileURL } from "node:url";

import { readDashboardReadModel } from "@/lib/dashboard-read";
import {
  runEndToEndPipeline,
  type PipelineDashboardStepResult,
} from "@/lib/pipeline-runner";
import {
  logRetailCrmImportResult,
  runRetailCrmImport,
} from "@/scripts/import-retailcrm";
import {
  logRetailCrmSyncResult,
  runRetailCrmSync,
} from "@/scripts/sync-retailcrm";
import {
  logTelegramHighValueAlertCheckResult,
  runTelegramHighValueAlertCheck,
} from "@/scripts/send-telegram-alerts";

function formatDashboardMetric(input: {
  amount: number | null;
  currencyCode: string | null;
}): string {
  if (input.amount === null || input.currencyCode === null) {
    return "Mixed currencies";
  }

  return `${new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 2,
  }).format(input.amount)} ${input.currencyCode}`;
}

async function readDashboardDataPathSummary(): Promise<PipelineDashboardStepResult> {
  const dashboard = await readDashboardReadModel();

  return {
    averageOrderValueLabel: formatDashboardMetric({
      amount: dashboard.averageOrderValue.amount,
      currencyCode: dashboard.averageOrderValue.currencyCode,
    }),
    latestOrdersCount: dashboard.latestOrders.length,
    ordersByDayPoints: dashboard.ordersByDay.length,
    totalOrders: dashboard.totalOrders,
    totalRevenueLabel: formatDashboardMetric({
      amount: dashboard.revenueMetric.amount,
      currencyCode: dashboard.revenueMetric.currencyCode,
    }),
  };
}

function logDashboardDataPathSummary(
  result: PipelineDashboardStepResult,
  logger: Pick<Console, "log"> = console,
) {
  logger.log("Dashboard data path verified from Supabase.");
  logger.log(`Total orders: ${result.totalOrders}`);
  logger.log(`Total revenue: ${result.totalRevenueLabel}`);
  logger.log(`Average order value: ${result.averageOrderValueLabel}`);
  logger.log(`Orders-by-day points: ${result.ordersByDayPoints}`);
  logger.log(`Latest orders loaded: ${result.latestOrdersCount}`);
}

export async function runLocalPipeline(logger: Pick<Console, "log" | "error"> = console) {
  const result = await runEndToEndPipeline({
    logger,
    readDashboard: async () => {
      const dashboardResult = await readDashboardDataPathSummary();

      logDashboardDataPathSummary(dashboardResult, logger);

      return dashboardResult;
    },
    runAlerts: async () => {
      const alertResult = await runTelegramHighValueAlertCheck();

      logTelegramHighValueAlertCheckResult(alertResult, logger);

      return alertResult;
    },
    runImport: async () => {
      const importResult = await runRetailCrmImport();

      logRetailCrmImportResult(importResult, logger);

      return importResult;
    },
    runSync: async () => {
      const syncResult = await runRetailCrmSync();

      logRetailCrmSyncResult(syncResult, logger);

      return syncResult;
    },
  });

  logger.log("Pipeline summary JSON:");
  logger.log(JSON.stringify(result, null, 2));

  return result;
}

async function main() {
  await runLocalPipeline();
}

const isDirectExecution =
  typeof process.argv[1] === "string" &&
  import.meta.url === pathToFileURL(process.argv[1]).href;

if (isDirectExecution) {
  main().catch((error: unknown) => {
    const message = error instanceof Error ? error.message : "Unknown pipeline failure.";

    console.error("End-to-end pipeline run failed.");
    console.error(message);

    process.exitCode = 1;
  });
}
