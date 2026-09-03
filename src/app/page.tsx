import { prisma } from '@/lib/prisma';
import AddNovelForm from '@/components/AddNovelForm';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const novels = await prisma.novel.findMany({
    orderBy: { updatedAt: 'desc' }
  });

  return (
    <div>
      <h1 style={{ marginBottom: '2rem' }}>My Library</h1>
      
      <AddNovelForm />

      <div className="grid-novels">
        {novels.map((novel: any) => (
          <Link href={`/novel/${novel.id}`} key={novel.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {novel.coverImageBase64 ? (
              <img 
                src={novel.coverImageBase64} 
                alt={novel.title} 
                style={{ width: '100%', height: '300px', objectFit: 'cover', borderRadius: 'var(--radius-md)' }} 
              />
            ) : (
              <div style={{ width: '100%', height: '300px', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span className="text-muted">No Cover</span>
              </div>
            )}
            <div>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>{novel.title}</h3>
              <p className="text-muted" style={{ fontSize: '0.875rem' }}>
                Latest: Chapter {novel.latestChapterNumber}
              </p>
              <p className="text-muted" style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>
                Updates ~{novel.expectedUpdateHour}:00
              </p>
            </div>
          </Link>
        ))}
        {novels.length === 0 && (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)' }}>
            <p className="text-muted">Your library is empty. Add a novel to get started.</p>
          </div>
        )}
      </div>
    </div>
  );
}
