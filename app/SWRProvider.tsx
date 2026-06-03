'use client'

import { SWRConfig } from 'swr'
import { fetcher } from '@/lib/fetcher'

export default function SWRProvider({ children }: { children: React.ReactNode }) {
  return (
    <SWRConfig value={{
      fetcher,
      keepPreviousData: true,
      revalidateOnFocus: true,
      dedupingInterval: 10000,
    }}>
      {children}
    </SWRConfig>
  )
}
