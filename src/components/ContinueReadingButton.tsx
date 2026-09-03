'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function ContinueReadingButton({ novelId, chapters }: { novelId: string, chapters: { id: string, title: string }[] }) {
  const [lastReadChapterId, setLastReadChapterId] = useState<string | null>(null);

  useEffect(() => {
    try {
      const lastRead = JSON.parse(localStorage.getItem('lastRead') || '{}');
      if (lastRead[novelId]) {
        setLastReadChapterId(lastRead[novelId]);
      }
    } catch (err) {}
  }, [novelId]);

  const fallbackChapterId = chapters.length > 0 ? chapters[chapters.length - 1].id : null;
  const targetChapterId = lastReadChapterId || fallbackChapterId;
  const targetChapter = chapters.find(c => c.id === targetChapterId);

  if (!targetChapterId) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '2rem' }}>
      <Link 
        href={`/novel/${novelId}/chapter/${targetChapterId}`} 
        className="btn btn-primary" 
        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginTop: '1rem' }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="5 3 19 12 5 21 5 3"></polygon>
        </svg>
        {lastReadChapterId ? 'Continue Reading' : 'Start Reading'}
      </Link>
      {targetChapter && (
        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.5rem', fontWeight: 500 }}>
          {targetChapter.title}
        </span>
      )}
    </div>
  );
}
