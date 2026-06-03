'use client'

import useSWR from 'swr'
import type { UserSession } from '@/types/database'
import HomeView from './HomeView'

export default function HomeClient({ session }: { session: UserSession }) {
  const { data, isLoading } = useSWR('/api/data/home')

  if (!data && isLoading) return null

  return (
    <HomeView
      session={session}
      departments={data?.departments ?? []}
      deptLatest={data?.deptLatest ?? {}}
      teamMembers={data?.teamMembers ?? []}
      memberLatest={data?.memberLatest ?? {}}
      readsMap={data?.readsMap ?? {}}
      reactionsMap={data?.reactionsMap ?? {}}
      repliesMap={data?.repliesMap ?? {}}
      allPostIds={data?.allPostIds ?? []}
      importantPosts={data?.importantPosts ?? []}
      avatarMap={data?.avatarMap ?? {}}
    />
  )
}
