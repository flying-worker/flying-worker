import { Link, usePage } from '@inertiajs/react'

export default function CenteredLayout({ children }) {
  const { user } = usePage().props
  return (
    <div style={{ fontFamily: 'sans-serif', minHeight: '100vh', background: '#f1f5f9' }}>
      <header style={{ background: '#fff', borderBottom: '1px solid #e2e8f0', padding: '12px 24px', display: 'flex', alignItems: 'center' }}>
        <Link href="/" style={{ color: '#0f172a', textDecoration: 'none', fontWeight: 700, marginRight: 24 }}>
          Home
        </Link>
        <Link href="/about" style={{ color: '#0f172a', textDecoration: 'none', fontWeight: 700 }}>
          About
        </Link>
        {user && (
          <span style={{ marginLeft: 'auto', color: '#64748b', fontSize: 14 }}>
            👤 {user}
          </span>
        )}
      </header>
      <div style={{ maxWidth: 640, margin: '48px auto', background: '#fff', borderRadius: 8, padding: 32, boxShadow: '0 1px 4px rgba(0,0,0,.08)' }}>
        {children}
      </div>
    </div>
  )
}
