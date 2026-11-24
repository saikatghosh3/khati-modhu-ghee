import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Noto_Sans_Bengali } from 'next/font/google'
import { InitialLoader } from '@/components/initial-loader'
import './globals.css'

const notoSansBengali = Noto_Sans_Bengali({
  subsets: ['bengali', 'latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'ঘরকথা | খাঁটি গাওয়া ঘি ও সুন্দরবনের মধু',
  description: 'পাবনা-সিরাজগঞ্জের গাওয়া ঘি এবং সুন্দরবনের খাঁটি মধু—সারা বাংলাদেশে ক্যাশ অন ডেলিভারিতে অর্ডার করুন।',
  applicationName: 'ঘরকথা',
  manifest: '/manifest.webmanifest',
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/favicon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
    ],
    shortcut: '/favicon-32.png',
    apple: [{ url: '/apple-icon.png', sizes: '180x180', type: 'image/png' }],
  },
}

export const viewport: Viewport = {
  colorScheme: 'light',
  themeColor: '#143c2d',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="bn">
      <body className={`${notoSansBengali.className} antialiased`} suppressHydrationWarning>
        <script dangerouslySetInnerHTML={{ __html: "try{if(sessionStorage.getItem('ghorkotha_loaded'))document.documentElement.dataset.ghLoaded='1'}catch(e){}" }} />
        <InitialLoader />
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
