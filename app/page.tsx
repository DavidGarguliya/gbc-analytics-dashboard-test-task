import { loadDashboardReadModel } from "@/lib/dashboard-data";

import { DashboardView } from "./dashboard-view";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

export default async function Home() {
  const dashboard = await loadDashboardReadModel();

  return (
    <main className={styles.page}>
      <DashboardView dashboard={dashboard} renderedAt={new Date().toISOString()} />
    </main>
  );
}
