import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'ঘরকথা | খাঁটি গাওয়া ঘি ও সুন্দরবনের মধু',
    short_name: 'ঘরকথা',
    description: 'পাবনা-সিরাজগঞ্জের গাওয়া ঘি এবং সুন্দরবনের খাঁটি মধু—সারা বাংলাদেশে ক্যাশ অন ডেলিভারিতে অর্ডার করুন।',
    start_url: '/',
    display: 'standalone',
    background_color: '#fbf8ef',
    theme_color: '#143c2d',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
  }
}