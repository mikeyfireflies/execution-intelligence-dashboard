'use client';

export default function LoadingSkeleton() {
    return (
        <div style={{ padding: 'var(--space-2xl)' }}>
            <div className="metrics-grid metrics-grid-4" style={{ marginBottom: 'var(--space-lg)' }}>
                {[1, 2, 3, 4, 5, 6, 7].map(i => (
                    <div key={i} className="card">
                        <div className="loading-skeleton" style={{ width: '60%', height: 12, marginBottom: 12, background: 'var(--bg-tertiary)', borderRadius: 4 }} />
                        <div className="loading-skeleton" style={{ width: '40%', height: 28, background: 'var(--bg-tertiary)', borderRadius: 4 }} />
                    </div>
                ))}
            </div>
            <div className="cards-grid">
                {[1, 2, 3].map(i => (
                    <div key={i} className="card" style={{ minHeight: 200 }}>
                        <div className="loading-skeleton" style={{ width: '70%', height: 16, marginBottom: 16, background: 'var(--bg-tertiary)', borderRadius: 4 }} />
                        <div className="loading-skeleton" style={{ width: '100%', height: 8, marginBottom: 12, background: 'var(--bg-tertiary)', borderRadius: 4 }} />
                        <div className="loading-skeleton" style={{ width: '90%', height: 8, marginBottom: 12, background: 'var(--bg-tertiary)', borderRadius: 4 }} />
                        <div className="loading-skeleton" style={{ width: '60%', height: 8, background: 'var(--bg-tertiary)', borderRadius: 4 }} />
                    </div>
                ))}
            </div>
            <style jsx>{`
        .loading-skeleton {
          animation: pulse 1.5s infinite ease-in-out;
        }
        @keyframes pulse {
          0% { opacity: 0.6; }
          50% { opacity: 0.3; }
          100% { opacity: 0.6; }
        }
      `}</style>
        </div>
    );
}
