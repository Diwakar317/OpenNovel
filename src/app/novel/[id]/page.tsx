import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function NovelPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const novel = await prisma.novel.findUnique({
    where: { id },
    include: {
      chapters: {
        orderBy: { chapterNumber: 'desc' }
      }
    }
  });

  if (!novel) notFound();

  const deleteAction = async () => {
    'use server';
    await prisma.novel.delete({ where: { id: novel.id } });
    const { revalidatePath } = await import('next/cache');
    const { redirect } = await import('next/navigation');
    revalidatePath('/');
    redirect('/');
  };

  return (
    <div>
      <div className="card novel-header">
        {novel.coverImageBase64 && (
          <img 
            src={novel.coverImageBase64} 
            alt={novel.title} 
            style={{ width: '200px', height: '300px', objectFit: 'cover', borderRadius: 'var(--radius-md)' }} 
          />
        )}
        <div>
          <h1 style={{ marginBottom: '1rem' }}>{novel.title}</h1>
          <div className="flex-wrap" style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
            <span className="text-muted">Source: {novel.sourceDomain}</span>
            <span className="text-muted">Chapters: {novel.chapters.length}</span>
            <span className="text-muted">Updates: ~{novel.expectedUpdateHour}:00</span>
          </div>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
            <a href={novel.sourceUrl} target="_blank" rel="noopener noreferrer" className="btn btn-secondary">
              View on Source
            </a>
            <form action={deleteAction}>
              <button type="submit" className="btn btn-secondary" style={{ color: '#fa5252', borderColor: '#fa5252' }}>
                Delete Novel
              </button>
            </form>
          </div>
        </div>
      </div>

      <h2>Chapters</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem' }}>
        {novel.chapters.map((chapter: any) => (
          <Link 
            href={`/novel/${novel.id}/chapter/${chapter.id}`} 
            key={chapter.id}
            className="card"
            style={{ padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
          >
            <span style={{ fontWeight: 500 }}>{chapter.title}</span>
            <span className="text-muted" style={{ fontSize: '0.875rem' }}>
              {new Date(chapter.createdAt).toLocaleDateString()}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
