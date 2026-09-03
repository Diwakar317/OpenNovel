import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Link from 'next/link';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'OpenNovel',
  description: 'A beautifully designed web novel reader and offline sync tool.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <header className="app-header">
          <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Link href="/" className="app-logo" style={{ fontSize: '1.5rem', fontWeight: 700 }}>
              <span style={{ color: 'var(--accent-color)' }}>❖</span> OpenNovel
            </Link>
            <nav style={{ display: 'flex', gap: '1rem' }}>
              <Link href="/" className="btn btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.9rem' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"></path>
                </svg>
                Library
              </Link>
            </nav>
          </div>
        </header>
        <main className="main-content">
          <div className="container">
            {children}
          </div>
        </main>
      </body>
    </html>
  );
}
