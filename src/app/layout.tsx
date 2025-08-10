"use client";

import type { Metadata } from 'next';
import { usePathname } from 'next/navigation';
import './globals.css';
import { AuthProvider } from '@/context/auth-context';
import MainLayout from '@/components/main-layout';
import { Toaster } from "@/components/ui/toaster"

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/login';

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <title>Caseflow CRM</title>
        <meta name="description" content="A web-based Customer Relationship Management (CRM) system." />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        <AuthProvider>
          {isLoginPage ? children : <MainLayout>{children}</MainLayout>}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
