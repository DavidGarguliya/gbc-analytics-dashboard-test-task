export type PipelineImportStepResult = {
  fixturePath: string;
  outcome: "duplicate-safe-rejected" | "uploaded";
  preparedOrders: number;
  resolvedCurrency: string;
  resolvedSite: string;
  uploadedOrders: number;
};

export type PipelineSyncStepResult = {
  latestCreatedAt: string | null;
  latestRetailCrmId: number | null;
  ordersFetched: number;
  ordersUpserted: number;
  pageSize: number;
  pagesProcessed: number;
  previousCompletedAt: string | null;
  resolvedSite: string;
  syncStateKey: string;
};

export type PipelineDashboardStepResult = {
  averageOrderValueLabel: string;
  latestOrdersCount: number;
  ordersByDayPoints: number;
  totalOrders: number;
  totalRevenueLabel: string;
};

export type PipelineAlertStepResult = {
  alertedRetailCrmIds: number[];
  pendingOrders: number;
  sentAlerts: number;
  sentAt: string;
  threshold: number;
};

export type EndToEndPipelineResult = {
  alerts: PipelineAlertStepResult;
  completedAt: string;
  dashboard: PipelineDashboardStepResult;
  import: PipelineImportStepResult;
  startedAt: string;
  sync: PipelineSyncStepResult;
};

type PipelineLogger = {
  error(message: string): void;
  log(message: string): void;
};

function summarizeImportOutcome(importResult: PipelineImportStepResult): string {
  return `import ${importResult.outcome} (prepared=${importResult.preparedOrders}, uploaded=${importResult.uploadedOrders})`;
}

function summarizeSyncOutcome(syncResult: PipelineSyncStepResult): string {
  return `sync fetched/upserted=${syncResult.ordersFetched}/${syncResult.ordersUpserted}`;
}

function summarizeDashboardOutcome(dashboardResult: PipelineDashboardStepResult): string {
  return `dashboard totalOrders=${dashboardResult.totalOrders}, latestOrders=${dashboardResult.latestOrdersCount}`;
}

function summarizeAlertOutcome(alertResult: PipelineAlertStepResult): string {
  return `alerts pending/sent=${alertResult.pendingOrders}/${alertResult.sentAlerts}`;
}

export async function runEndToEndPipeline(input: {
  logger?: PipelineLogger;
  now?: () => string;
  readDashboard: () => Promise<PipelineDashboardStepResult>;
  runAlerts: () => Promise<PipelineAlertStepResult>;
  runImport: () => Promise<PipelineImportStepResult>;
  runSync: () => Promise<PipelineSyncStepResult>;
}): Promise<EndToEndPipelineResult> {
  const logger = input.logger ?? console;
  const now = input.now ?? (() => new Date().toISOString());
  const startedAt = now();
  let currentStage = "startup";

  logger.log("Starting end-to-end pipeline run.");

  try {
    currentStage = "import";
    logger.log("[1/4] Importing orders into RetailCRM...");
    const importResult = await input.runImport();

    currentStage = "sync";
    logger.log("[2/4] Syncing RetailCRM orders into Supabase...");
    const syncResult = await input.runSync();

    currentStage = "dashboard";
    logger.log("[3/4] Reading dashboard data from Supabase...");
    const dashboardResult = await input.readDashboard();

    currentStage = "alerts";
    logger.log("[4/4] Sending Telegram alerts...");
    const alertResult = await input.runAlerts();

    const completedAt = now();

    logger.log("End-to-end pipeline run completed.");
    logger.log(
      `Final summary: ${summarizeImportOutcome(importResult)}; ${summarizeSyncOutcome(syncResult)}; ${summarizeDashboardOutcome(dashboardResult)}; ${summarizeAlertOutcome(alertResult)}.`,
    );

    return {
      alerts: alertResult,
      completedAt,
      dashboard: dashboardResult,
      import: importResult,
      startedAt,
      sync: syncResult,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown pipeline failure.";

    logger.error(`End-to-end pipeline failed during ${currentStage}: ${message}`);
    throw error;
  }
}
