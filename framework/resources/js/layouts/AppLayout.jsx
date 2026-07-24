import { Link, usePage } from '@inertiajs/react'

export default function AppLayout({ children }) {
  const { user } = usePage().props
  return (
    <div style={{ fontFamily: 'sans-serif', minHeight: '100vh' }}>
      <nav style={{ background: '#1e293b', padding: '12px 24px', display: 'flex', gap: 24, alignItems: 'center' }}>
        <Link href="/" style={{ color: '#f8fafc', textDecoration: 'none', fontWeight: 600 }}>
          Home
        </Link>
        <Link href="/about" style={{ color: '#94a3b8', textDecoration: 'none' }}>
          About
        </Link>
        {user && (
          <span style={{ marginLeft: 'auto', color: '#94a3b8', fontSize: 14 }}>
            👤 {user}
          </span>
        )}
      </nav>
      <main style={{ padding: 32 }}>
        {children}
      </main>
    </div>
  )
}
