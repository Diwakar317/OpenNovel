'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AddNovelForm() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/novels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });
      
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || 'Failed to add novel');
      
      setUrl('');
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '3rem 0', textAlign: 'center', marginBottom: '2rem' }}>
      <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem', fontWeight: 800 }}>Welcome to OpenNovel</h1>
      <p className="text-muted" style={{ marginBottom: '2rem', fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto 2rem auto' }}>
        Paste a link from Ranobes or NovelArrow to add it to your library and seamlessly track your reading progress.
      </p>
      
      <form onSubmit={handleSubmit} style={{ display: 'flex', maxWidth: '700px', margin: '0 auto', boxShadow: 'var(--shadow-md)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
        <input 
          type="url" 
          placeholder="https://ranobes.net/novels/..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          required
          style={{ 
            flex: 1, 
            padding: '1.25rem 1.5rem', 
            border: 'none',
            background: 'var(--bg-secondary)',
            color: 'var(--text-primary)',
            fontSize: '1.1rem',
            outline: 'none'
          }}
        />
        <button type="submit" style={{ padding: '0 2rem', background: 'var(--accent-color)', color: '#fff', border: 'none', fontWeight: 600, fontSize: '1.1rem', cursor: 'pointer', transition: 'background 0.2s' }} disabled={loading}>
          {loading ? 'Adding...' : 'Add to Library'}
        </button>
      </form>
      {error && <p style={{ color: '#fa5252', marginTop: '1rem' }}>{error}</p>}
    </div>
  );
}
