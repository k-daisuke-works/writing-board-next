import { getSession } from '@/lib/session'
import { redirect } from 'next/navigation'
import HomeClient from './HomeClient'

export default async function HomePage() {
  const session = await getSession()
  if (!session) redirect('/login')
  return <HomeClient session={session} />
}
