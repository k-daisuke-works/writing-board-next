import { getSession } from '@/lib/session'
import { redirect } from 'next/navigation'
import ScheduleClient from './ScheduleClient'

export default async function SchedulePage() {
  const session = await getSession()
  if (!session) redirect('/login')
  return <ScheduleClient session={session} />
}
