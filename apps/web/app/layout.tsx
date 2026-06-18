import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { brand } from '@hivora/shared/brand'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'

const inter = Inter({ subsets: ['latin'], display: 'swap' })

export const metadata: Metadata = {
  title: { default: brand.displayName, template: `%s | ${brand.displayName}` },
  description: brand.description,
  metadataBase: new URL(brand.url),
  openGraph: {
    title: brand.displayName,
    description: brand.description,
    url: brand.url,
    siteName: brand.displayName,
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: brand.displayName,
    description: brand.description,
  },
  icons: {
    icon: '/icon.svg',
    shortcut: '/logo.svg',
    apple: '/logo.svg',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`${inter.className} min-h-screen flex flex-col antialiased`}>
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  )
}
