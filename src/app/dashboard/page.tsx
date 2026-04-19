'use client'

import { useAuth } from '@/lib/auth-context'
import { auth } from '@/lib/firebase'
import { signOut } from 'firebase/auth'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function DashboardPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) router.push('/login')
  }, [user, loading, router])

  if (loading) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <p className="text-gray-400">Loading…</p>
    </div>
  )

  return (
    <main className="min-h-screen bg-gray-950 p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">NCR Dashboard</h1>
            <p className="text-gray-400 text-sm mt-1">{user?.email}</p>
          </div>
          <button onClick={() => signOut(auth).then(() => router.push('/login'))}
            className="text-sm text-gray-400 hover:text-white transition-colors">
            Sign out
          </button>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 text-center">
          <p className="text-gray-400">🎉 Firebase connected. Step 1 complete.</p>
          <p className="text-gray-600 text-sm mt-2">NCR list coming in Step 2.</p>
        </div>
      </div>
    </main>
  )
}
