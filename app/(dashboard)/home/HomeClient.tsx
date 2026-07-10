'use client'

import useSWR from 'swr'
import type { UserSession } from '@/types/database'
import HomeView from './HomeView'

export default function HomeClient({ session, hasInstagram = false }: { session: UserSession; hasInstagram?: boolean }) {
  const { data, isLoading } = useSWR('/api/data/home')

  if (!data && isLoading) return null

  return (
    <HomeView
      session={session}
      hasInstagram={hasInstagram}
      noticePosts={data?.noticePosts ?? []}
      teamMembers={data?.teamMembers ?? []}
      memberLatest={data?.memberLatest ?? {}}
      readsMap={data?.readsMap ?? {}}
      reactionsMap={data?.reactionsMap ?? {}}
      repliesMap={data?.repliesMap ?? {}}
      allPostIds={data?.allPostIds ?? []}
      importantPosts={data?.importantPosts ?? []}
      avatarMap={data?.avatarMap ?? {}}
      attachmentsMap={data?.attachmentsMap ?? {}}
    />
  )
}
