import { getSession } from '@/lib/session'
import { redirect } from 'next/navigation'
import MembersClient from './MembersClient'

export default async function MembersPage() {
  const session = await getSession()
  if (!session) redirect('/login')
  return <MembersClient session={session} />
}
