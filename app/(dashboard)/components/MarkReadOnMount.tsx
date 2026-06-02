'use client'

import { useEffect } from 'react'
import { markPostsRead } from '@/actions/social'

export default function MarkReadOnMount({ postIds }: { postIds: number[] }) {
  useEffect(() => {
    if (postIds.length > 0) markPostsRead(postIds)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return null
}
