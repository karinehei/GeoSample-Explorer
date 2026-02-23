import type { ReactNode } from 'react';

interface AppLayoutProps {
  header: ReactNode;
  leftPanel: ReactNode;
  mapPanel: ReactNode;
}

export function AppLayout({ header, leftPanel, mapPanel }: AppLayoutProps) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header style={{ padding: '16px 24px', background: '#fff', borderBottom: '1px solid #ddd' }}>
        {header}
      </header>
      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        <aside
          style={{
            width: 320,
            minWidth: 280,
            background: '#fff',
            borderRight: '1px solid #ddd',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {leftPanel}
        </aside>
        <main style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
          {mapPanel}
        </main>
      </div>
    </div>
  );
}
