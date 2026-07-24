import { useState } from 'react'
import { Head, Link } from '@inertiajs/react'
import AppLayout from '../layouts/AppLayout'

export default function Home({ name }) {
  const [count, setCount] = useState(1)

  return (
    <AppLayout>
      <Head title="Home">
        <meta
          name="description"
          content="Flying Worker home — a Laravel-inspired full-stack framework for Cloudflare Workers."
          head-key="description"
        />
      </Head>
      <h1>Home Page — {name}</h1>
      <button onClick={() => setCount(c => c + 1)}>
        Count: {count}
      </button>
      <p style={{ marginTop: 16 }}>
        <Link href="/about">Go to About →</Link>
      </p>
        <img src="logo.png" alt=""/>
    </AppLayout>
  )
}
