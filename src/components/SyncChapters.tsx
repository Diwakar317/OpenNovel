'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SyncChapters({ novelId }: { novelId: string }) {
  const [loading, setLoading] = useState(false);
  const [chapters, setChapters] = useState(100);
  const router = useRouter();

  const handleSync = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/novels/${novelId}/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chapters })
      });
      if (res.ok) {
        router.refresh();
      } else {
        const errorData = await res.json();
        alert(errorData.error || 'Failed to sync chapters');
      }
    } catch (e) {
      console.error(e);
      alert('An error occurred during sync');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
      <input 
        type="number" 
        value={chapters} 
        onChange={e => setChapters(Number(e.target.value))}
        style={{ 
          width: '100px', 
          padding: '0.6rem', 
          borderRadius: 'var(--radius-sm)',
          border: '1px solid #333',
          backgroundColor: 'var(--bg-secondary)',
          color: 'var(--text-primary)'
        }}
        min={1}
        disabled={loading}
      />
      <button 
        onClick={handleSync} 
        disabled={loading} 
        className="btn btn-primary"
      >
        {loading ? 'Syncing...' : 'Sync Chapters'}
      </button>
    </div>
  );
}
