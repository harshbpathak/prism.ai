import { AppHeader } from "@/components/layout/app-header"

export default function ResultLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <AppHeader title="Simulation Results" />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </>
  )
}
