'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { markChaptersRead, clearChaptersContent } from '@/app/actions/chapterActions';

type Chapter = {
  id: string;
  title: string;
  createdAt: Date;
  content: string;
  isRead: boolean;
};

export default function ChapterList({ novelId, chapters }: { novelId: string, chapters: Chapter[] }) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressMsg, setProgressMsg] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const router = useRouter();
  
  const pageSize = 25;
  const totalPages = Math.ceil(chapters.length / pageSize);
  const paginatedChapters = chapters.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      const pageIds = paginatedChapters.map(c => c.id);
      setSelectedIds(new Set([...selectedIds, ...pageIds]));
    } else {
      const next = new Set(selectedIds);
      paginatedChapters.forEach(c => next.delete(c.id));
      setSelectedIds(next);
    }
  };

  const handleSelect = (id: string, checked: boolean) => {
    const next = new Set(selectedIds);
    if (checked) next.add(id);
    else next.delete(id);
    setSelectedIds(next);
  };

  const onMarkRead = async (ids: string[], isRead: boolean) => {
    setIsProcessing(true);
    setProgressMsg(`Marking ${ids.length} chapter(s) as ${isRead ? 'read' : 'unread'}...`);
    await markChaptersRead(novelId, ids, isRead);
    setSelectedIds(new Set());
    setProgressMsg('');
    setIsProcessing(false);
  };

  const onClearContent = async (ids: string[]) => {
    if (!confirm(`Are you sure you want to clear downloads for ${ids.length} chapter(s)?`)) return;
    setIsProcessing(true);
    setProgressMsg(`Clearing ${ids.length} chapter(s)...`);
    await clearChaptersContent(novelId, ids);
    setSelectedIds(new Set());
    setProgressMsg('');
    setIsProcessing(false);
  };

  const onDownload = async (ids: string[]) => {
    setIsProcessing(true);
    let success = 0;
    for (let i = 0; i < ids.length; i++) {
      setProgressMsg(`Downloading chapter ${i + 1} of ${ids.length}...`);
      try {
        const res = await fetch(`/api/chapters/${ids[i]}`);
        if (res.ok) success++;
      } catch (e) {
        console.error('Failed to download chapter', ids[i], e);
      }
      // slight delay to prevent hammering our own API
      await new Promise(r => setTimeout(r, 100)); 
    }
    setProgressMsg(`Downloaded ${success}/${ids.length} chapters.`);
    setTimeout(() => {
      setProgressMsg('');
      setIsProcessing(false);
      setSelectedIds(new Set());
      router.refresh();
    }, 1500);
  };

  const selectedArray = Array.from(selectedIds);

  return (
    <div style={{ marginTop: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h2>Chapters ({chapters.length})</h2>
        
        {isProcessing && <span className="text-muted" style={{ fontWeight: 500 }}>{progressMsg}</span>}
        
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button 
            disabled={selectedIds.size === 0 || isProcessing} 
            className="btn btn-primary" 
            style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
            onClick={() => onDownload(selectedArray)}
          >
            Download ({selectedIds.size})
          </button>
          <button 
            disabled={selectedIds.size === 0 || isProcessing} 
            className="btn btn-secondary" 
            style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
            onClick={() => onMarkRead(selectedArray, true)}
          >
            Mark Read
          </button>
          <button 
            disabled={selectedIds.size === 0 || isProcessing} 
            className="btn btn-secondary" 
            style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
            onClick={() => onClearContent(selectedArray)}
          >
            Clear Data
          </button>
        </div>
      </div>

      <div className="card" style={{ padding: '0.5rem 1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <input 
          type="checkbox" 
          checked={paginatedChapters.length > 0 && paginatedChapters.every(c => selectedIds.has(c.id))}
          onChange={handleSelectAll}
          style={{ width: '1.2rem', height: '1.2rem', cursor: 'pointer' }}
        />
        <span style={{ fontWeight: 600 }}>Select All on Page {currentPage}</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {paginatedChapters.map(chapter => {
          const isDownloaded = chapter.content && chapter.content.trim() !== '';
          const isChecked = selectedIds.has(chapter.id);
          
          return (
            <div 
              key={chapter.id}
              className="chapter-row"
              style={{ 
                padding: '1rem', 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                gap: '1rem',
                opacity: chapter.isRead ? 0.6 : 1,
                borderBottom: '1px solid var(--border-color)',
                borderLeft: isDownloaded ? '4px solid var(--accent-color)' : '4px solid transparent',
                transition: 'background-color 0.2s',
                backgroundColor: 'transparent'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1, minWidth: 0 }}>
                <input 
                  type="checkbox" 
                  checked={isChecked}
                  onChange={(e) => handleSelect(chapter.id, e.target.checked)}
                  style={{ width: '1.2rem', height: '1.2rem', cursor: 'pointer' }}
                />
                
                <Link 
                  href={`/novel/${novelId}/chapter/${chapter.id}`} 
                  style={{ 
                    flex: 1, 
                    fontWeight: 500, 
                    textDecoration: chapter.isRead ? 'line-through' : 'none',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                >
                  {chapter.title}
                </Link>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <span className="text-muted" style={{ fontSize: '0.75rem', marginRight: '0.5rem', display: 'none' }}>
                  {new Date(chapter.createdAt).toISOString().split('T')[0]}
                </span>
                
                {!isDownloaded ? (
                  <button onClick={() => onDownload([chapter.id])} disabled={isProcessing} className="btn btn-primary" style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}>
                    ↓ Fetch
                  </button>
                ) : (
                  <button onClick={() => onClearContent([chapter.id])} disabled={isProcessing} className="btn btn-secondary" style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem', color: '#fa5252', borderColor: '#fa5252' }}>
                    ✕ Clear
                  </button>
                )}

                <button 
                  onClick={() => onMarkRead([chapter.id], !chapter.isRead)} 
                  disabled={isProcessing}
                  className="btn btn-secondary" 
                  style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}
                >
                  {chapter.isRead ? 'Unread' : 'Read'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', marginTop: '2rem' }}>
          <button 
            className="btn btn-secondary" 
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
          >
            &larr; Prev
          </button>
          <span style={{ fontWeight: 500 }}>
            Page {currentPage} of {totalPages}
          </span>
          <button 
            className="btn btn-secondary" 
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
          >
            Next &rarr;
          </button>
        </div>
      )}
    </div>
  );
}
