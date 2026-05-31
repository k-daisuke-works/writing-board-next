'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'

type Props = {
  text: string
  className?: string
}

export function ExpandableText({ text, className = '' }: Props) {
  const [expanded, setExpanded] = useState(false)
  const [isClamped, setIsClamped] = useState(false)
  const ref = useRef<HTMLParagraphElement>(null)

  useEffect(() => {
    const el = ref.current
    if (el) setIsClamped(el.scrollHeight > el.clientHeight + 2)
  }, [text])

  return (
    <div>
      <p ref={ref} className={`${className} break-words ${!expanded ? 'line-clamp-8' : ''}`}>
        {text}
      </p>
      {(isClamped || expanded) && (
        <button
          onClick={(e) => { e.stopPropagation(); setExpanded(v => !v) }}
          className="mt-1.5 flex items-center gap-0.5 text-xs text-blue-600 hover:text-blue-800 transition-colors"
        >
          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${expanded ? 'rotate-180' : ''}`} />
          {expanded ? '閉じる' : '続きを読む'}
        </button>
      )}
    </div>
  )
}
