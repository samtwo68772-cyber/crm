
"use client";

import type { Metadata } from 'next';
import { usePathname } from 'next/navigation';
import './globals.css';
import { AuthProvider } from '@/context/auth-context';
import MainLayout from '@/components/main-layout';
import { Toaster } from "@/components/ui/toaster"
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

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
      </head>
      <body className={`${inter.className} antialiased`}>
        <AuthProvider>
          {isLoginPage ? children : <MainLayout>{children}</MainLayout>}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
