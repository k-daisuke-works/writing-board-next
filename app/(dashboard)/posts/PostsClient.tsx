'use client'

import useSWR from 'swr'
import type { UserSession } from '@/types/database'
import RealtimePosts from './RealtimePosts'

export default function PostsClient({ session }: { session: UserSession }) {
  const { data, isLoading } = useSWR('/api/data/posts')

  if (!data && isLoading) return null

  return (
    <RealtimePosts
      key={data?.fetchedAt ?? 0}
      initialPosts={data?.latestPosts ?? {}}
      departments={data?.departments ?? []}
      session={session}
      initialReadsMap={data?.readsMap ?? {}}
      initialReactionsMap={data?.reactionsMap ?? {}}
      initialRepliesMap={data?.repliesMap ?? {}}
      initialAvatarMap={data?.avatarMap ?? {}}
    />
  )
}
