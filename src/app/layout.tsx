import type { Metadata, Viewport } from 'next';
import './globals.css';
import { PWARegister } from '@/components/PWARegister';

export const metadata: Metadata = {
  title: 'PV Abogadas - Gestion de Expedientes',
  description: 'Reserva, portal de clientes y gestion profesional de expedientes de extranjeria',
  manifest: '/manifest.json',
  applicationName: 'Consultorio',
  appleWebApp: {
    capable: true,
    title: 'Consultorio',
    statusBarStyle: 'default',
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: '/icons/icon-180.png',
  },
};

export const viewport: Viewport = {
  themeColor: '#0b1f2d',
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
