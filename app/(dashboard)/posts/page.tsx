import { getSession } from '@/lib/session'
import { redirect } from 'next/navigation'
import PostsClient from './PostsClient'

export default async function PostsPage() {
  const session = await getSession()
  if (!session) redirect('/login')
  return <PostsClient session={session} />
}
