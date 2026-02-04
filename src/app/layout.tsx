import type { Metadata } from 'next';
import './globals.css';
import { PWARegister } from '@/components/PWARegister';

export const metadata: Metadata = {
  title: 'Abogados PV - Reserva de Citas',
  description: 'Reserva tu cita con abogadas especializadas en derecho de extranjeria e inmigracion',
  manifest: '/manifest.json',
  themeColor: '#0D9488',
  applicationName: 'Consultorio',
  appleWebApp: {
    capable: true,
    title: 'Consultorio',
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
