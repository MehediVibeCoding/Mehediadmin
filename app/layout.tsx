import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Vangcur Admin',
  description: 'Vangcur — Admin Panel',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="bn">
      <body className="min-h-screen bg-gradient-to-b from-brand-bg via-[#DCEBFD] to-white bg-fixed font-body text-ink antialiased">
        {children}
      </body>
    </html>
  );
}
