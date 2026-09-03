import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import SyncChapters from '@/components/SyncChapters';
import ChapterList from '@/components/ChapterList';
import ContinueReadingButton from '@/components/ContinueReadingButton';

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

  const firstChapterId = novel.chapters.length > 0 ? novel.chapters[novel.chapters.length - 1].id : null;

  return (
    <div className="container" style={{ padding: '2rem 1.5rem' }}>
      
      {/* Novel Header Section */}
      <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', marginBottom: '3rem', background: 'var(--bg-secondary)', padding: '2rem', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-color)' }}>
        {novel.coverImageBase64 ? (
          <img 
            src={novel.coverImageBase64} 
            alt={novel.title} 
            style={{ width: '220px', height: '330px', objectFit: 'cover', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-md)' }} 
          />
        ) : (
          <div style={{ width: '220px', height: '330px', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span className="text-muted" style={{ fontWeight: 600 }}>NO COVER</span>
          </div>
        )}
        
        <div style={{ flex: 1, minWidth: '300px', display: 'flex', flexDirection: 'column' }}>
          <h1 style={{ marginBottom: '0.5rem', fontSize: '2.2rem', fontWeight: 800 }}>{novel.title}</h1>
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
            <span style={{ padding: '0.2rem 0.6rem', background: 'var(--bg-tertiary)', borderRadius: '4px', fontSize: '0.85rem', fontWeight: 600 }}>Source: {novel.sourceDomain}</span>
            <span style={{ padding: '0.2rem 0.6rem', background: 'var(--bg-tertiary)', borderRadius: '4px', fontSize: '0.85rem', fontWeight: 600 }}>{novel.chapters.length} Chapters</span>
            <span style={{ padding: '0.2rem 0.6rem', background: 'var(--bg-tertiary)', borderRadius: '4px', fontSize: '0.85rem', fontWeight: 600 }}>Updates: ~{novel.expectedUpdateHour}:00</span>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem', marginTop: 'auto' }}>
            <ContinueReadingButton novelId={novel.id} chapters={novel.chapters} />
          </div>

          {novel.isSyncing && (
            <div style={{ background: 'var(--accent-muted)', color: 'var(--accent-color)', padding: '0.8rem', borderRadius: 'var(--radius-sm)', fontSize: '0.9rem', fontWeight: 600, animation: 'pulse 2s infinite', marginBottom: '1rem' }}>
              ⏳ Syncing in background... (Refresh to see more chapters)
            </div>
          )}

          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
            <SyncChapters novelId={novel.id} />
            <form action={deleteAction} style={{ marginLeft: 'auto' }}>
              <button type="submit" style={{ color: '#fa5252', background: 'transparent', border: 'none', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer' }}>
                Delete Novel
              </button>
            </form>
          </div>
        </div>
      </div>

      <ChapterList novelId={novel.id} chapters={novel.chapters as any} />
    </div>
  );
}
