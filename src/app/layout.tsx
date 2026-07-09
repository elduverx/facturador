import type { Metadata, Viewport } from 'next';
import './globals.css';
import { PWARegister } from '@/components/PWARegister';

export const metadata: Metadata = {
  title: 'PV Abogadas - expertas en Extranjeria | Laboral | Familia',
  description: 'Despacho de abogadas expertas en extranjería, laboral y familia. Reserva tu cita online.',
  manifest: '/manifest.json',
  applicationName: 'PV Abogadas',
  appleWebApp: {
    capable: true,
    title: 'PV Abogadas',
    statusBarStyle: 'default',
  },
  openGraph: {
    title: 'PV Abogadas - expertas en Extranjeria | Laboral | Familia',
    description: 'Despacho de abogadas expertas en extranjería, laboral y familia. Reserva tu cita online.',
    images: [{ url: '/logopv.jpeg', width: 800, height: 600, alt: 'PV Abogadas Logo' }],
    type: 'website',
  },
  icons: {
    icon: [
      { url: '/logopv.jpeg', sizes: 'any' },
    ],
    apple: '/logopv.jpeg',
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
