import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'BuilderHub Console',
  description: 'Manage your builders and organizations',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full">{children}</body>
    </html>
  )
}
