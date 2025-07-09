import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'tetris App',
  description: 'Created with v0',
  generator: 'tetris.dev',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
