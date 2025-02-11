import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import Template from "./_components/template"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: {
    default: "Vimi Studio - Innovative Design Agency for Digital Products",
    template: "%s | Vimi Studio"
  },
  description: "Created with v0"
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Template>{children}</Template>
      </body>
    </html>
  )
}
