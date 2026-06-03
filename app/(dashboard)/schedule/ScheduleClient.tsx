'use client'

import useSWR from 'swr'
import type { UserSession } from '@/types/database'
import ScheduleView from './ScheduleView'

export default function ScheduleClient({ session }: { session: UserSession }) {
  const { data, isLoading } = useSWR('/api/data/schedule')

  if (!data && isLoading) return null

  return (
    <ScheduleView
      allEvents={data?.allEvents ?? []}
      deptEvents={data?.deptEvents ?? []}
      scheduleEvents={data?.scheduleEvents ?? []}
      departments={data?.departments ?? []}
      session={session}
    />
  )
}
