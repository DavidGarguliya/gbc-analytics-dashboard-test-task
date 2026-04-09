import { describe, expect, it, vi } from "vitest";

import {
  runEndToEndPipeline,
  type PipelineAlertStepResult,
  type PipelineDashboardStepResult,
  type PipelineImportStepResult,
  type PipelineSyncStepResult,
} from "@/lib/pipeline-runner";

function createLogger() {
  return {
    error: vi.fn(),
    log: vi.fn(),
  };
}

const importResult: PipelineImportStepResult = {
  fixturePath: "/tmp/mock_orders.json",
  outcome: "uploaded",
  preparedOrders: 50,
  resolvedCurrency: "KZT",
  resolvedSite: "garguliyadavid",
  uploadedOrders: 50,
};

const syncResult: PipelineSyncStepResult = {
  latestCreatedAt: "2026-02-19T09:00:00.000Z",
  latestRetailCrmId: 90,
  ordersFetched: 50,
  ordersUpserted: 50,
  pageSize: 50,
  pagesProcessed: 1,
  previousCompletedAt: "2026-04-09T21:00:00.000Z",
  resolvedSite: "garguliyadavid",
  syncStateKey: "retailcrm_orders_sync",
};

const dashboardResult: PipelineDashboardStepResult = {
  averageOrderValueLabel: "49,020 KZT",
  latestOrdersCount: 8,
  ordersByDayPoints: 50,
  totalOrders: 50,
  totalRevenueLabel: "2,451,000 KZT",
};

const alertResult: PipelineAlertStepResult = {
  alertedRetailCrmIds: [43, 45],
  pendingOrders: 2,
  sentAlerts: 2,
  sentAt: "2026-04-10T10:05:00.000Z",
  threshold: 50000,
};

describe("runEndToEndPipeline", () => {
  it("runs every step in order and returns a final honest summary", async () => {
    const logger = createLogger();
    const callOrder: string[] = [];

    const result = await runEndToEndPipeline({
      logger,
      now: vi
        .fn()
        .mockReturnValueOnce("2026-04-10T10:00:00.000Z")
        .mockReturnValueOnce("2026-04-10T10:06:00.000Z"),
      readDashboard: vi.fn(async () => {
        callOrder.push("dashboard");

        return dashboardResult;
      }),
      runAlerts: vi.fn(async () => {
        callOrder.push("alerts");

        return alertResult;
      }),
      runImport: vi.fn(async () => {
        callOrder.push("import");

        return importResult;
      }),
      runSync: vi.fn(async () => {
        callOrder.push("sync");

        return syncResult;
      }),
    });

    expect(callOrder).toEqual(["import", "sync", "dashboard", "alerts"]);
    expect(result).toEqual({
      alerts: alertResult,
      completedAt: "2026-04-10T10:06:00.000Z",
      dashboard: dashboardResult,
      import: importResult,
      startedAt: "2026-04-10T10:00:00.000Z",
      sync: syncResult,
    });

    expect(logger.log).toHaveBeenCalledWith("Starting end-to-end pipeline run.");
    expect(logger.log).toHaveBeenCalledWith("[1/4] Importing orders into RetailCRM...");
    expect(logger.log).toHaveBeenCalledWith("[2/4] Syncing RetailCRM orders into Supabase...");
    expect(logger.log).toHaveBeenCalledWith("[3/4] Reading dashboard data from Supabase...");
    expect(logger.log).toHaveBeenCalledWith("[4/4] Sending Telegram alerts...");
    expect(logger.log).toHaveBeenCalledWith(
      "Final summary: import uploaded (prepared=50, uploaded=50); sync fetched/upserted=50/50; dashboard totalOrders=50, latestOrders=8; alerts pending/sent=2/2.",
    );
  });

  it("keeps duplicate-safe import outcomes honest in the summary", async () => {
    const logger = createLogger();

    await runEndToEndPipeline({
      logger,
      now: vi
        .fn()
        .mockReturnValueOnce("2026-04-10T10:00:00.000Z")
        .mockReturnValueOnce("2026-04-10T10:04:00.000Z"),
      readDashboard: vi.fn().mockResolvedValue(dashboardResult),
      runAlerts: vi.fn().mockResolvedValue({
        ...alertResult,
        alertedRetailCrmIds: [],
        pendingOrders: 0,
        sentAlerts: 0,
      }),
      runImport: vi.fn().mockResolvedValue({
        ...importResult,
        outcome: "duplicate-safe-rejected",
        uploadedOrders: 0,
      }),
      runSync: vi.fn().mockResolvedValue(syncResult),
    });

    expect(logger.log).toHaveBeenCalledWith(
      "Final summary: import duplicate-safe-rejected (prepared=50, uploaded=0); sync fetched/upserted=50/50; dashboard totalOrders=50, latestOrders=8; alerts pending/sent=0/0.",
    );
  });

  it("fails fast and does not continue after a critical step failure", async () => {
    const logger = createLogger();
    const readDashboard = vi.fn();
    const runAlerts = vi.fn();
    const runImport = vi.fn().mockResolvedValue(importResult);
    const runSync = vi.fn().mockRejectedValue(new Error("Supabase unavailable"));

    await expect(
      runEndToEndPipeline({
        logger,
        now: vi.fn().mockReturnValue("2026-04-10T10:00:00.000Z"),
        readDashboard,
        runAlerts,
        runImport,
        runSync,
      }),
    ).rejects.toThrow("Supabase unavailable");

    expect(runImport).toHaveBeenCalledTimes(1);
    expect(runSync).toHaveBeenCalledTimes(1);
    expect(readDashboard).not.toHaveBeenCalled();
    expect(runAlerts).not.toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalledWith(
      "End-to-end pipeline failed during sync: Supabase unavailable",
    );
  });
});
