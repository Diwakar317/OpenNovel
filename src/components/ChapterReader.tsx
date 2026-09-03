'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function ChapterReader({ novelId, chapterId }: { novelId: string, chapterId: string }) {
  const [chapter, setChapter] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchChapter = async () => {
      try {
        const res = await fetch(`/api/chapters/${chapterId}`);
        const data = await res.json();
        
        if (!res.ok) throw new Error(data.error || 'Failed to load chapter');
        
        setChapter(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchChapter();
  }, [chapterId]);

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '5rem 0' }}>
      <h2 className="text-muted">Loading chapter content...</h2>
      <p className="text-muted" style={{ marginTop: '1rem' }}>If this is the first time, we are scraping it from the source.</p>
    </div>
  );
  
  if (error) return <div style={{ color: '#fa5252', padding: '2rem' }}>Error: {error}</div>;
  if (!chapter) return null;

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', paddingBottom: '5rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <Link href={`/novel/${novelId}`} className="btn btn-secondary" style={{ marginBottom: '1rem' }}>
          &larr; Back to Novel
        </Link>
        <h1 style={{ fontSize: '2rem' }}>{chapter.title}</h1>
      </div>
      
      <div 
        className="chapter-content reader-content"
        dangerouslySetInnerHTML={{ __html: chapter.content }}
      />
    </div>
  );
}
