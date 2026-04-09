import styles from "./page.module.css";

const deliveryStages = [
  "RetailCRM import pipeline",
  "Supabase schema and sync engine",
  "Dashboard metrics and recent orders",
  "Telegram alerting for high-value orders",
] as const;

export default function Home() {
  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <p className={styles.eyebrow}>M1 · Repository Scaffold</p>
        <h1 className={styles.title}>RetailCRM Analytics Dashboard</h1>
        <p className={styles.description}>
          The repository is now shaped for the delivery path defined in the governing
          documentation: imports stay server-side, Supabase remains the dashboard read model,
          and alerting stays outside the browser boundary.
        </p>
        <div className={styles.actions}>
          <div className={styles.primaryAction}>Branch: task/scaffold</div>
          <div className={styles.secondaryAction}>Next slice: M2 data model</div>
        </div>
      </section>

      <section className={styles.panel}>
        <div>
          <p className={styles.panelLabel}>Current focus</p>
          <h2 className={styles.panelTitle}>Scaffold complete, integrations next</h2>
        </div>

        <ul className={styles.stageList}>
          {deliveryStages.map((stage) => (
            <li className={styles.stageItem} key={stage}>
              <span className={styles.stageMarker} />
              <span>{stage}</span>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
