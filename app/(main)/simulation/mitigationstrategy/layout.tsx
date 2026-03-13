import { AppHeader } from "@/components/layout/app-header"

export default function MitigationStrategyLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <AppHeader title="Mitigation Strategy" />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </>
  )
}
