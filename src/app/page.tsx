import { prisma } from '@/lib/prisma';
import AddNovelForm from '@/components/AddNovelForm';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const novels = await prisma.novel.findMany({
    orderBy: { updatedAt: 'desc' }
  });

  return (
    <div className="container">
      <AddNovelForm />

      <h2 style={{ marginBottom: '1.5rem', fontWeight: 700 }}>Recently Added</h2>
      
      <div className="grid-novels">
        {novels.map((novel: any) => (
          <Link href={`/novel/${novel.id}`} key={novel.id} className="novel-cover-card">
            {novel.coverImageBase64 ? (
              <img 
                src={novel.coverImageBase64} 
                alt={novel.title} 
              />
            ) : (
              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-tertiary)' }}>
                <span className="text-muted" style={{ fontWeight: 600 }}>NO COVER</span>
              </div>
            )}
            <div className="novel-cover-gradient">
              <h3 className="novel-cover-title">{novel.title}</h3>
              <p style={{ fontSize: '0.8rem', opacity: 0.8, marginTop: '0.2rem' }}>
                {novel.latestChapterNumber ? `Ch. ${novel.latestChapterNumber}` : 'Syncing...'}
              </p>
            </div>
          </Link>
        ))}
        {novels.length === 0 && (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '5rem 0' }}>
            <p className="text-muted" style={{ fontSize: '1.1rem' }}>Your library is empty. Add a novel above.</p>
          </div>
        )}
      </div>
    </div>
  );
}
