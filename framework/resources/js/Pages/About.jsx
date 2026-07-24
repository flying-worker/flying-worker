import { useState } from 'react'
import { Head, Link } from '@inertiajs/react'
import CenteredLayout from '../layouts/CenteredLayout'

export default function About({ team }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <CenteredLayout>
      <Head title="About">
        <meta
          name="description"
          content="About Flying Worker — Hono + Inertia + React running on Cloudflare Workers."
          head-key="description"
        />
      </Head>
      <h1>About: {team}</h1>
      <button onClick={() => setExpanded(e => !e)}>
        {expanded ? 'Show Less' : 'Show More'}
      </button>
      {expanded && (
        <p>This is a demo of Inertia.js with Hono and React on Cloudflare Workers!</p>
      )}
      <p style={{ marginTop: 16 }}>
        <Link href="/">← Back to Home</Link>
      </p>
    </CenteredLayout>
  )
}
