import type { Metadata } from 'next';
import './globals.css';
import { PWARegister } from '@/components/PWARegister';

export const metadata: Metadata = {
  title: 'Facturador - Autonomos Espana',
  description: 'Crea facturas legales para autonomos en Espana (RD 1619/2012)',
  manifest: '/manifest.json',
  themeColor: '#0D9488',
  applicationName: 'Facturador',
  appleWebApp: {
    capable: true,
    title: 'Facturador',
    statusBarStyle: 'default',
  },
  icons: {
    icon: [
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: '/icons/icon-180.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>
        {children}
        <PWARegister />
      </body>
    </html>
  );
}
