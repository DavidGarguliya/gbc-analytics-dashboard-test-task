import type { CSSProperties } from "react";

import { loadDashboardReadModel } from "@/lib/dashboard-data";

import styles from "./page.module.css";

export const dynamic = "force-dynamic";

function formatMoneyValue(input: {
  amount: number | null;
  currencyCode: string | null;
}): string {
  if (input.amount === null || input.currencyCode === null) {
    return "Смешанные валюты";
  }

  return `${new Intl.NumberFormat("ru-RU", {
    maximumFractionDigits: 2,
  }).format(input.amount)} ${input.currencyCode}`;
}

function formatDateLabel(value: string): string {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
    year: "numeric",
  }).format(new Date(value));
}

function formatShortDateLabel(value: string): string {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  }).format(new Date(value));
}

function formatDateRangeLabel(input: {
  endDate: string | null;
  startDate: string | null;
}): string {
  const { endDate, startDate } = input;

  if (startDate === null || endDate === null) {
    return "Нет данных";
  }

  return `${formatDateLabel(startDate)} — ${formatDateLabel(endDate)}`;
}

function formatWeekRangeLabel(input: {
  weekEnd: string;
  weekStart: string;
}): string {
  return `${formatShortDateLabel(input.weekStart)} — ${formatShortDateLabel(input.weekEnd)}`;
}

function formatNumberValue(value: number): string {
  return new Intl.NumberFormat("ru-RU", {
    maximumFractionDigits: 2,
  }).format(value);
}

export default async function Home() {
  const dashboard = await loadDashboardReadModel();
  const maxWeeklyCount = Math.max(...dashboard.ordersByWeek.map((entry) => entry.count), 1);
  const periodLabel = formatDateRangeLabel({
    endDate: dashboard.cadenceSummary.lastOrderDate,
    startDate: dashboard.cadenceSummary.firstOrderDate,
  });
  const cadenceLabel =
    dashboard.cadenceSummary.steadyDailyCount === null
      ? "Ритм менялся по дням"
      : `${dashboard.cadenceSummary.steadyDailyCount} заказ в активный день`;

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroMeta}>
          <p className={styles.eyebrow}>M5 · Витрина данных дашборда</p>
          <span className={styles.readModelBadge}>Только чтение из Supabase</span>
        </div>
        <h1 className={styles.title}>Дашборд заказов RetailCRM</h1>
        <p className={styles.description}>
          Экран читает только синхронизированную модель заказов в Supabase. Суммы и валюты
          показываются ровно в том виде, в котором они были сохранены после live-sync из
          RetailCRM, без клиентской переинтерпретации и без пересчёта валют.
        </p>
        <div className={styles.heroChips}>
          <span className={styles.heroChip}>Период данных: {periodLabel}</span>
          <span className={styles.heroChip}>
            Активных дней: {formatNumberValue(dashboard.cadenceSummary.activeDays)}
          </span>
          <span className={styles.heroChip}>Ритм: {cadenceLabel}</span>
        </div>
      </section>

      <section className={styles.metricsGrid} aria-label="Ключевые метрики дашборда">
        <article className={styles.metricCard}>
          <p className={styles.metricLabel}>Заказов</p>
          <p className={styles.metricValue}>{formatNumberValue(dashboard.totalOrders)}</p>
          <p className={styles.metricSupport}>Синхронизировано из RetailCRM в Supabase</p>
        </article>
        <article className={styles.metricCard}>
          <p className={styles.metricLabel}>{dashboard.revenueMetric.label}</p>
          <p className={styles.metricValue}>
            {formatMoneyValue({
              amount: dashboard.revenueMetric.amount,
              currencyCode: dashboard.revenueMetric.currencyCode,
            })}
          </p>
          <p className={styles.metricSupport}>Сумма по сохранённым заказам</p>
        </article>
        <article className={styles.metricCard}>
          <p className={styles.metricLabel}>{dashboard.averageOrderValue.label}</p>
          <p className={styles.metricValue}>
            {formatMoneyValue({
              amount: dashboard.averageOrderValue.amount,
              currencyCode: dashboard.averageOrderValue.currencyCode,
            })}
          </p>
          <p className={styles.metricSupport}>Среднее значение по сохранённой выручке</p>
        </article>
        <article className={styles.metricCard}>
          <p className={styles.metricLabel}>Период</p>
          <p className={styles.metricValueCompact}>{periodLabel}</p>
          <p className={styles.metricSupport}>
            Пик: {formatNumberValue(dashboard.cadenceSummary.peakDayCount)} заказ(а) в день
          </p>
        </article>
      </section>

      <section className={styles.contentGrid}>
        <article className={`${styles.panel} ${styles.trendPanel}`}>
          <div className={styles.panelHeader}>
            <div>
              <p className={styles.panelLabel}>Ритм заказов</p>
              <h2 className={styles.panelTitle}>Недельная сводка вместо плоской дневной сетки</h2>
            </div>
            <p className={styles.panelNote}>
              Дневной поток в этом наборе данных слишком ровный, поэтому экран показывает
              агрегацию по неделям и отдельно объясняет дневной ритм.
            </p>
          </div>

          <div className={styles.summaryGrid}>
            <div className={styles.summaryCard}>
              <span className={styles.summaryLabel}>Активные дни</span>
              <strong className={styles.summaryValue}>
                {formatNumberValue(dashboard.cadenceSummary.activeDays)}
              </strong>
            </div>
            <div className={styles.summaryCard}>
              <span className={styles.summaryLabel}>Среднее в активный день</span>
              <strong className={styles.summaryValue}>
                {formatNumberValue(dashboard.cadenceSummary.averageOrdersPerActiveDay)}
              </strong>
            </div>
            <div className={styles.summaryCard}>
              <span className={styles.summaryLabel}>Пиковая нагрузка</span>
              <strong className={styles.summaryValue}>
                {formatNumberValue(dashboard.cadenceSummary.peakDayCount)}
              </strong>
            </div>
          </div>

          {dashboard.ordersByWeek.length === 0 ? (
            <div className={styles.emptyState}>
              <p className={styles.emptyTitle}>Нет данных для отображения</p>
              <p className={styles.emptyDescription}>
                После первого sync сюда подтянется недельная структура заказов из Supabase.
              </p>
            </div>
          ) : (
            <div className={styles.weeklyList}>
              {dashboard.ordersByWeek.map((entry) => {
                const width = `${Math.max((entry.count / maxWeeklyCount) * 100, 14)}%`;

                return (
                  <div className={styles.weekRow} key={entry.weekStart}>
                    <div className={styles.weekMeta}>
                      <span className={styles.weekRange}>
                        {formatWeekRangeLabel({
                          weekEnd: entry.weekEnd,
                          weekStart: entry.weekStart,
                        })}
                      </span>
                      <span className={styles.weekSupport}>По дням внутри недели</span>
                    </div>
                    <div className={styles.weekTrack}>
                      <div
                        className={styles.weekBar}
                        style={{ width } as CSSProperties}
                      />
                    </div>
                    <div className={styles.weekCount}>{entry.count}</div>
                    <div className={styles.weekRevenue}>
                      {formatMoneyValue({
                        amount: entry.revenueAmount,
                        currencyCode: dashboard.revenueMetric.currencyCode,
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </article>

        <article className={`${styles.panel} ${styles.insightPanel}`}>
          <div className={styles.panelHeaderCompact}>
            <p className={styles.panelLabel}>Интерпретация</p>
            <h2 className={styles.panelTitle}>Что здесь важно увидеть</h2>
          </div>

          <div className={styles.insightBody}>
            <p className={styles.insightLead}>
              {dashboard.cadenceSummary.steadyDailyCount === null
                ? "Поток заказов менялся по дням, поэтому ключевая точка наблюдения здесь — недельное распределение."
                : `На уровне дня поток был ровным: по ${dashboard.cadenceSummary.steadyDailyCount} заказу в каждый активный день. Поэтому дашборд не показывает 50 одинаковых столбцов, а собирает данные по неделям.`}
            </p>

            <dl className={styles.definitionList}>
              <div className={styles.definitionRow}>
                <dt>Период</dt>
                <dd>{periodLabel}</dd>
              </div>
              <div className={styles.definitionRow}>
                <dt>Активных дней</dt>
                <dd>{formatNumberValue(dashboard.cadenceSummary.activeDays)}</dd>
              </div>
              <div className={styles.definitionRow}>
                <dt>Среднее в активный день</dt>
                <dd>{formatNumberValue(dashboard.cadenceSummary.averageOrdersPerActiveDay)}</dd>
              </div>
              <div className={styles.definitionRow}>
                <dt>Пиковый день</dt>
                <dd>{formatNumberValue(dashboard.cadenceSummary.peakDayCount)} заказ(а)</dd>
              </div>
            </dl>

            <p className={styles.insightFootnote}>
              Колонка «{dashboard.sourceColumnLabel}» ниже остаётся консервативной: в ней может
              быть как исходный источник заказа, так и резервное значение метода заказа из
              синхронизированной модели.
            </p>
          </div>
        </article>

        <article className={`${styles.panel} ${styles.tablePanel}`}>
          <div className={styles.panelHeader}>
            <div>
              <p className={styles.panelLabel}>Последние записи</p>
              <h2 className={styles.panelTitle}>Недавно синхронизированные заказы</h2>
            </div>
            <p className={styles.panelNote}>Таблица читает только витрину данных в Supabase.</p>
          </div>

          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Заказ</th>
                  <th>Дата</th>
                  <th>Статус</th>
                  <th>Сумма</th>
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
                    <td>{order.status ?? "Не указан"}</td>
                    <td>
                      {new Intl.NumberFormat("ru-RU", {
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
