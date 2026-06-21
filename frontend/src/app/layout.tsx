import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import '../styles/globals.css';
import { Providers } from '@/providers/Providers';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: { default: 'NexusOne AI', template: '%s | NexusOne AI' },
  description: 'AI-powered Enterprise Business Operating System — CRM, Projects, HRM, Billing, Support & More',
  keywords: ['enterprise', 'saas', 'ai', 'crm', 'erp', 'hrm', 'billing', 'support'],
  authors: [{ name: 'NexusOne AI' }],
  themeColor: [{ media: '(prefers-color-scheme: light)', color: '#6366f1' }, { media: '(prefers-color-scheme: dark)', color: '#4338ca' }],
  icons: { icon: '/favicon.ico', apple: '/apple-touch-icon.png' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
