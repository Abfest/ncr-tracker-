import type { Metadata } from 'next'
import { Poppins } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/lib/auth-context'

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-poppins',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'SQS NCR Tracker',
  description: 'Non-Conformance Report Management System by Smart Quality Systems',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${poppins.variable} ${poppins.className}`}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  )
}
