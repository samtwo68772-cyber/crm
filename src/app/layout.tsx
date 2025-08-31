
"use client";

import type { Metadata } from 'next';
import { usePathname } from 'next/navigation';
import './globals.css';
import { AuthProvider } from '@/context/auth-context';
import MainLayout from '@/components/main-layout';
import { Toaster } from "@/components/ui/toaster"
import { Inter, Space_Grotesk } from 'next/font/google'
import { QueryProvider } from '@/components/query-provider';
import React from 'react';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], variable: '--font-space-grotesk' });


// This component will wrap the children and handle chunk load errors
function ChunkLoadErrorHandler({ children }: { children: React.ReactNode }) {
  React.useEffect(() => {
    const handleChunkLoadError = (event: Event) => {
      // The event for a chunk load error is not standard, so we check the error message.
      // This is a common pattern for handling these errors.
      if (event.type === 'error') {
        const error = (event as ErrorEvent).error;
        if (error && (error.name === 'ChunkLoadError' || /Loading chunk .* failed/i.test(error.message))) {
          console.warn('ChunkLoadError detected, forcing a page reload.');
          window.location.reload();
        }
      }
    };
    
    // We also listen for unhandled promise rejections, as dynamic imports return promises.
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const error = event.reason;
      if (error && (error.name === 'ChunkLoadError' || /Loading chunk .* failed/i.test(error.message))) {
        console.warn('ChunkLoadError (from promise rejection) detected, forcing a page reload.');
        window.location.reload();
      }
    };

    window.addEventListener('error', handleChunkLoadError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleChunkLoadError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  return <>{children}</>;
}


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
        <title>MinT CRM</title>
        <meta name="description" content="A web-based Customer Relationship Management (CRM) system." />
      </head>
      <body className={`${inter.variable} ${spaceGrotesk.variable} font-sans antialiased`}>
        <QueryProvider>
          <AuthProvider>
            <ChunkLoadErrorHandler>
              {isLoginPage ? children : <MainLayout>{children}</MainLayout>}
            </ChunkLoadErrorHandler>
            <Toaster />
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
