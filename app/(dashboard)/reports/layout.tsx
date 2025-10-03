import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Reports",
  description: "Comprehensive property management reports and analytics",
}

export default function ReportsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}