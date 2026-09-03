'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { markChaptersRead } from '@/app/actions/chapterActions';

type ReaderSettings = {
  fontFamily: string;
  fontSize: number;
  lineHeight: number;
  padding: number;
  backgroundColor: string;
  textColor: string;
};

const defaultSettings: ReaderSettings = {
  fontFamily: 'Inter',
  fontSize: 18,
  lineHeight: 1.6,
  padding: 2,
  backgroundColor: '#1a1a1a',
  textColor: '#e0e0e0',
};

export default function ChapterReader({ novelId, chapterId }: { novelId: string, chapterId: string }) {
  const [chapter, setChapter] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [settings, setSettings] = useState<ReaderSettings>(defaultSettings);
  const [showOptions, setShowOptions] = useState(false);
  const [isSettingsLoaded, setIsSettingsLoaded] = useState(false);
  
  const bottomRef = useRef<HTMLDivElement>(null);
  const [hasMarkedRead, setHasMarkedRead] = useState(false);

  const markCurrentAsRead = useCallback(() => {
    if (!hasMarkedRead) {
      setHasMarkedRead(true);
      markChaptersRead(novelId, [chapterId], true).catch(console.error);
    }
  }, [hasMarkedRead, novelId, chapterId]);

  useEffect(() => {
    const saved = localStorage.getItem('readerSettings');
    if (saved) {
      try { setSettings(JSON.parse(saved)); } catch (e) {}
    }
    setIsSettingsLoaded(true);
  }, []);

  useEffect(() => {
    setHasMarkedRead(false); // Reset when chapter changes
  }, [chapterId]);

  useEffect(() => {
    if (!bottomRef.current || hasMarkedRead || loading || error) return;
    
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        markCurrentAsRead();
      }
    }, { threshold: 0.1 });

    observer.observe(bottomRef.current);
    return () => observer.disconnect();
  }, [bottomRef, hasMarkedRead, loading, error, markCurrentAsRead]);

  useEffect(() => {
    const fetchChapter = async () => {
      try {
        const res = await fetch(`/api/chapters/${chapterId}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to load chapter');
        setChapter(data);
        
        // Track last read chapter
        const lastRead = JSON.parse(localStorage.getItem('lastRead') || '{}');
        lastRead[novelId] = chapterId;
        localStorage.setItem('lastRead', JSON.stringify(lastRead));
        
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchChapter();
  }, [chapterId, novelId]);

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '5rem 0' }}>
      <h2 className="text-muted">Loading chapter content...</h2>
    </div>
  );
  
  if (error) return <div style={{ color: '#fa5252', padding: '2rem' }}>Error: {error}</div>;
  if (!chapter) return null;

  const updateSetting = (key: keyof ReaderSettings, val: any) => {
    setSettings(s => {
      const newSettings = { ...s, [key]: val };
      localStorage.setItem('readerSettings', JSON.stringify(newSettings));
      return newSettings;
    });
  };

  const resetSettings = () => {
    setSettings(defaultSettings);
    localStorage.setItem('readerSettings', JSON.stringify(defaultSettings));
  };

  return (
    <div style={{ 
      backgroundColor: settings.backgroundColor, 
      color: settings.textColor, 
      minHeight: '100vh', 
      transition: 'all 0.2s',
      fontFamily: settings.fontFamily 
    }}>
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem 1rem 5rem 1rem', width: '100%' }}>
        
        {/* Breadcrumb Navigation */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center', fontSize: '0.85rem', color: settings.textColor, opacity: 0.6, marginBottom: '2rem' }}>
          <Link href="/" style={{ textDecoration: 'none', color: 'inherit' }}>Library</Link>
          <span>»</span>
          <Link href={`/novel/${novelId}`} style={{ textDecoration: 'none', color: 'inherit' }}>{chapter.novel.title}</Link>
          <span>»</span>
          <span style={{ opacity: 0.7 }}>{chapter.title}</span>
        </div>

        {/* Top Actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
          <button 
            onClick={() => setShowOptions(true)}
            style={{ background: 'transparent', border: 'none', color: settings.textColor, cursor: 'pointer', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold' }}
          >
            ⚙ OPTIONS
          </button>
        </div>

        {/* Navigation Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem', flexWrap: 'wrap', gap: '1rem' }}>
          {chapter.prevChapterId ? (
            <Link href={`/novel/${novelId}/chapter/${chapter.prevChapterId}`} className="btn-pill">
              &laquo; BACK
            </Link>
          ) : (
             <button className="btn-pill" disabled style={{ opacity: 0.5 }}>&laquo; BACK</button>
          )}
          
          <Link href={`/novel/${novelId}`} className="btn-pill">
            CHAPTERS LIST
          </Link>
          
          {chapter.nextChapterId ? (
            <Link href={`/novel/${novelId}/chapter/${chapter.nextChapterId}`} className="btn-pill" onClick={markCurrentAsRead}>
              NEXT &raquo;
            </Link>
          ) : (
            <button className="btn-pill" disabled style={{ opacity: 0.5 }}>NEXT &raquo;</button>
          )}
        </div>
        
        {/* Title Area */}
        <div style={{ marginBottom: '3rem' }}>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem', fontWeight: 700 }}>{chapter.title}</h1>
          <h2 style={{ fontSize: '1.1rem', opacity: 0.7, fontWeight: 400 }}>{chapter.novel.title}</h2>
        </div>
        
        {/* Content Area */}
        <div 
          className="chapter-content reader-content"
          style={{ 
            fontSize: `${settings.fontSize}px`, 
            lineHeight: settings.lineHeight,
            padding: `0 ${settings.padding}rem`
          }}
          dangerouslySetInnerHTML={{ __html: chapter.content }}
        />
        
        {/* Intersection Observer Target */}
        <div ref={bottomRef} style={{ height: '20px', width: '100%', marginTop: '1rem' }} />
        
        {/* Bottom Navigation */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4rem', flexWrap: 'wrap', gap: '1rem' }}>
          {chapter.prevChapterId ? (
            <Link href={`/novel/${novelId}/chapter/${chapter.prevChapterId}`} className="btn-pill">
              &laquo; BACK
            </Link>
          ) : (
             <button className="btn-pill" disabled style={{ opacity: 0.5 }}>&laquo; BACK</button>
          )}
          
          <Link href={`/novel/${novelId}`} className="btn-pill">
            CHAPTERS LIST
          </Link>
          
          {chapter.nextChapterId ? (
            <Link href={`/novel/${novelId}/chapter/${chapter.nextChapterId}`} className="btn-pill" onClick={markCurrentAsRead}>
              NEXT &raquo;
            </Link>
          ) : (
            <button className="btn-pill" disabled style={{ opacity: 0.5 }}>NEXT &raquo;</button>
          )}
        </div>

      </div>

      {/* Options Panel Overlay */}
      {showOptions && (
        <div className="reader-options-modal">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #444', paddingBottom: '0.8rem' }}>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, letterSpacing: '0.5px' }}>READING SETTINGS</h3>
            <button onClick={() => setShowOptions(false)} style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '1.2rem', cursor: 'pointer' }}>&times;</button>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <label style={{ fontSize: '0.85rem', color: '#aaa' }}>Font</label>
            <select 
              value={settings.fontFamily} 
              onChange={(e) => updateSetting('fontFamily', e.target.value)}
              style={{ width: '100%', padding: '0.5rem', background: '#252525', color: '#fff', border: '1px solid #444', borderRadius: '4px', outline: 'none' }}
            >
              <option value="Inter">Inter</option>
              <option value="Roboto">Roboto</option>
              <option value="Merriweather">Merriweather</option>
              <option value="Lora">Lora</option>
              <option value="Courier New">Courier New</option>
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <label style={{ fontSize: '0.85rem', color: '#aaa' }}>Font size</label>
            <div style={{ display: 'flex', background: '#252525', borderRadius: '4px', border: '1px solid #444' }}>
              <button style={{ flex: 1, padding: '0.5rem', background: 'transparent', color: '#fff', border: 'none', cursor: 'pointer' }} onClick={() => updateSetting('fontSize', Math.max(12, settings.fontSize - 1))}>-</button>
              <div style={{ flex: 2, padding: '0.5rem', textAlign: 'center', borderLeft: '1px solid #444', borderRight: '1px solid #444' }}>{settings.fontSize}px</div>
              <button style={{ flex: 1, padding: '0.5rem', background: 'transparent', color: '#fff', border: 'none', cursor: 'pointer' }} onClick={() => updateSetting('fontSize', Math.min(32, settings.fontSize + 1))}>+</button>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <label style={{ fontSize: '0.85rem', color: '#aaa' }}>Line height</label>
            <div style={{ display: 'flex', background: '#252525', borderRadius: '4px', border: '1px solid #444' }}>
              <button style={{ flex: 1, padding: '0.5rem', background: 'transparent', color: '#fff', border: 'none', cursor: 'pointer' }} onClick={() => updateSetting('lineHeight', Math.max(1, Number((settings.lineHeight - 0.1).toFixed(1))))}>-</button>
              <div style={{ flex: 2, padding: '0.5rem', textAlign: 'center', borderLeft: '1px solid #444', borderRight: '1px solid #444' }}>{settings.lineHeight}</div>
              <button style={{ flex: 1, padding: '0.5rem', background: 'transparent', color: '#fff', border: 'none', cursor: 'pointer' }} onClick={() => updateSetting('lineHeight', Math.min(3, Number((settings.lineHeight + 0.1).toFixed(1))))}>+</button>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <label style={{ fontSize: '0.85rem', color: '#aaa' }}>Padding</label>
            <div style={{ display: 'flex', background: '#252525', borderRadius: '4px', border: '1px solid #444' }}>
              <button style={{ flex: 1, padding: '0.5rem', background: 'transparent', color: '#fff', border: 'none', cursor: 'pointer' }} onClick={() => updateSetting('padding', Math.max(0, settings.padding - 1))}>-</button>
              <div style={{ flex: 2, padding: '0.5rem', textAlign: 'center', borderLeft: '1px solid #444', borderRight: '1px solid #444' }}>{settings.padding}rem</div>
              <button style={{ flex: 1, padding: '0.5rem', background: 'transparent', color: '#fff', border: 'none', cursor: 'pointer' }} onClick={() => updateSetting('padding', Math.min(10, settings.padding + 1))}>+</button>
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '1rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', flex: 1 }}>
              <label style={{ fontSize: '0.85rem', color: '#aaa' }}>Background</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#252525', padding: '0.3rem', borderRadius: '4px', border: '1px solid #444' }}>
                <input type="color" value={settings.backgroundColor} onChange={(e) => updateSetting('backgroundColor', e.target.value)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0, height: '25px', width: '100%' }} />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', flex: 1 }}>
              <label style={{ fontSize: '0.85rem', color: '#aaa' }}>Text color</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#252525', padding: '0.3rem', borderRadius: '4px', border: '1px solid #444' }}>
                <input type="color" value={settings.textColor} onChange={(e) => updateSetting('textColor', e.target.value)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0, height: '25px', width: '100%' }} />
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
            <button onClick={resetSettings} style={{ flex: 1, padding: '0.8rem', background: '#252525', color: '#fff', border: '1px solid #444', borderRadius: '4px', cursor: 'pointer', fontWeight: 600 }}>RESET</button>
            <button onClick={() => setShowOptions(false)} style={{ flex: 1, padding: '0.8rem', background: '#444', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 600 }}>SAVE</button>
          </div>

        </div>
      )}
    </div>
  );
}
