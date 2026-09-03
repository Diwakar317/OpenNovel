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
  title: 'OpenNovel | Personal Reader',
  description: 'Your personal novel aggregator and reader.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <header className="app-header">
          <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Link href="/" style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--accent-color)' }}>
              OpenNovel
            </Link>
            <nav>
              <Link href="/bookmarks" className="btn btn-secondary">Bookmarks</Link>
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
