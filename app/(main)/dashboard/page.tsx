import { Header } from "@/components/header";
import DashboardPage from "@/components/dashboard/dashboard-page";

export default function Home() {
  return (
    <>
      <Header title="Dashboard" />
      <main className="flex-1 overflow-auto">
        <DashboardPage />
      </main>
    </>
  );
}