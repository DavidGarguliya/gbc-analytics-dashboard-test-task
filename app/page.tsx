import type { CSSProperties } from "react";

import { loadDashboardReadModel } from "@/lib/dashboard-data";

import styles from "./page.module.css";

export const dynamic = "force-dynamic";

function formatMetricValue(input: {
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

function formatDateLabel(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
    year: "numeric",
  }).format(new Date(value));
}

export default async function Home() {
  const dashboard = await loadDashboardReadModel();
  const maxDailyCount = Math.max(...dashboard.ordersByDay.map((entry) => entry.count), 1);

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroMeta}>
          <p className={styles.eyebrow}>M5 · Dashboard Read Model</p>
          <span className={styles.readModelBadge}>Supabase only read path</span>
        </div>
        <h1 className={styles.title}>RetailCRM orders, rendered from synced Supabase data.</h1>
        <p className={styles.description}>
          This dashboard reads only the persisted Supabase order model. Amounts and currencies are
          displayed exactly as stored from the live RetailCRM contract of record, with no currency
          conversion or fixture reinterpretation.
        </p>
        <p className={styles.supportingNote}>
          Attribution remains intentionally conservative: the source column may contain a stored
          upstream source or the synced order method fallback.
        </p>
      </section>

      <section className={styles.metricsGrid} aria-label="Core dashboard metrics">
        <article className={styles.metricCard}>
          <p className={styles.metricLabel}>Total orders</p>
          <p className={styles.metricValue}>{dashboard.totalOrders}</p>
        </article>
        <article className={styles.metricCard}>
          <p className={styles.metricLabel}>{dashboard.revenueMetric.label}</p>
          <p className={styles.metricValue}>
            {formatMetricValue({
              amount: dashboard.revenueMetric.amount,
              currencyCode: dashboard.revenueMetric.currencyCode,
            })}
          </p>
        </article>
        <article className={styles.metricCard}>
          <p className={styles.metricLabel}>{dashboard.averageOrderValue.label}</p>
          <p className={styles.metricValue}>
            {formatMetricValue({
              amount: dashboard.averageOrderValue.amount,
              currencyCode: dashboard.averageOrderValue.currencyCode,
            })}
          </p>
        </article>
      </section>

      <section className={styles.dashboardGrid}>
        <article className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <p className={styles.panelLabel}>Orders by day</p>
              <h2 className={styles.panelTitle}>Daily order volume</h2>
            </div>
          </div>

          <div className={styles.chart}>
            {dashboard.ordersByDay.map((entry) => {
              const height = `${Math.max((entry.count / maxDailyCount) * 100, 12)}%`;

              return (
                <div className={styles.chartColumn} key={entry.date}>
                  <span className={styles.chartValue}>{entry.count}</span>
                  <div className={styles.chartTrack}>
                    <div
                      className={styles.chartBar}
                      style={{ height } as CSSProperties}
                    />
                  </div>
                  <span className={styles.chartLabel}>{formatDateLabel(entry.date)}</span>
                </div>
              );
            })}
          </div>
        </article>

        <article className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <p className={styles.panelLabel}>Latest orders</p>
              <h2 className={styles.panelTitle}>Recent synced records</h2>
            </div>
          </div>

          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Amount</th>
                  <th>{dashboard.sourceColumnLabel}</th>
                </tr>
              </thead>
              <tbody>
                {dashboard.latestOrders.map((order) => (
                  <tr key={order.retailcrmId}>
                    <td>
                      <div className={styles.orderIdentity}>
                        <span className={styles.orderNumber}>
                          {order.number ?? `#${order.retailcrmId}`}
                        </span>
                        <span className={styles.orderExternalId}>
                          {order.externalId ?? `retailcrm:${order.retailcrmId}`}
                        </span>
                      </div>
                    </td>
                    <td>{formatDateLabel(order.createdAt)}</td>
                    <td>{order.status ?? "Unspecified"}</td>
                    <td>
                      {new Intl.NumberFormat("en-US", {
                        maximumFractionDigits: 2,
                      }).format(order.totalSum)}{" "}
                      {order.currency}
                    </td>
                    <td>{order.sourceLabel}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
      </section>
    </main>
  );
}
