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
    <div className="card" style={{ marginBottom: '2rem' }}>
      <h2>Add New Bookmark</h2>
      <p className="text-muted" style={{ marginBottom: '1rem' }}>Paste a link from Ranobes or NovelArrow to start tracking it.</p>
      
      <form onSubmit={handleSubmit} className="flex-responsive">
        <input 
          type="url" 
          placeholder="https://ranobes.net/novels/..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          required
          style={{ 
            flex: 1, 
            padding: '0.75rem', 
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-color)',
            background: 'var(--bg-tertiary)',
            color: 'var(--text-primary)'
          }}
        />
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Adding...' : 'Bookmark Novel'}
        </button>
      </form>
      {error && <p style={{ color: '#fa5252', marginTop: '0.5rem' }}>{error}</p>}
    </div>
  );
}
