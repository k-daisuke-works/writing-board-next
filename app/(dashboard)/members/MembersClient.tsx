'use client'

import { useMemo, useState } from 'react'
import useSWR from 'swr'
import Link from 'next/link'
import { Users, Building2, ChevronRight, Search, X } from 'lucide-react'
import type { UserSession } from '@/types/database'

type Member = {
  user_key: number; user_name: string; avatar_url: string | null
  affiliation: string | null; profile: string | null; department_id: number
}

export default function MembersClient({ session }: { session: UserSession }) {
  const { data, isLoading } = useSWR('/api/data/members')
  const [query, setQuery] = useState('')
  const [deptFilter, setDeptFilter] = useState<number | 'all'>('all')

  const members: Member[] = data?.members ?? []
  const deptMap: Record<number, string> = data?.deptMap ?? {}

  // 実在する部署だけをフィルタ選択肢に（メンバーがいる部署）
  const deptOptions = useMemo(() => {
    const ids = [...new Set(members.map(m => m.department_id).filter(id => deptMap[id]))]
    return ids.map(id => ({ id, name: deptMap[id] })).sort((a, b) => a.name.localeCompare(b.name, 'ja'))
  }, [members, deptMap])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return members.filter(m => {
      if (deptFilter !== 'all' && m.department_id !== deptFilter) return false
      if (!q) return true
      return (
        m.user_name.toLowerCase().includes(q) ||
        (m.affiliation ?? '').toLowerCase().includes(q) ||
        (deptMap[m.department_id] ?? '').toLowerCase().includes(q)
      )
    })
  }, [members, deptMap, query, deptFilter])

  if (!data && isLoading) return null

  return (
    <div className="anim-fade-in max-w-2xl">
      <div className="mb-4">
        <h1 className="text-xl font-semibold text-gray-900">メンバー一覧</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {filtered.length}名{filtered.length !== members.length && ` / 全${members.length}名`}
        </p>
      </div>

      {/* 検索・絞り込み */}
      <div className="mb-4 flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="名前・所属・部署で検索"
            className="w-full min-h-[44px] rounded-lg border border-gray-300 bg-white pl-9 pr-9 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              aria-label="検索をクリア"
              className="absolute right-2 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full text-gray-400 hover:bg-gray-100"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        {deptOptions.length > 1 && (
          <select
            value={deptFilter}
            onChange={e => setDeptFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
            className="min-h-[44px] rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:w-44"
          >
            <option value="all">すべての部署</option>
            {deptOptions.map(d => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        )}
      </div>

      {filtered.length > 0 ? (
        <div className="space-y-2">
          {filtered.map(member => (
            <Link
              key={member.user_key}
              href={`/member/${member.user_key}`}
              className="flex items-center gap-4 bg-white border border-gray-200 rounded-lg px-4 py-3.5 hover:border-blue-300 hover:shadow-sm transition-all group"
            >
              <div className="w-11 h-11 rounded-full overflow-hidden bg-blue-100 shrink-0 border border-gray-200">
                {member.avatar_url ? (
                  <img src={member.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-blue-600 text-sm font-bold">
                    {member.user_name.slice(0, 1)}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium text-gray-900 group-hover:text-blue-700 transition-colors">
                    {member.user_name}
                  </span>
                  {member.user_key === session.userKey && (
                    <span className="text-xs text-blue-500 font-medium">（自分）</span>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                  {deptMap[member.department_id] && (
                    <span className="text-xs text-gray-500">{deptMap[member.department_id]}</span>
                  )}
                  {member.affiliation && (
                    <span className="flex items-center gap-0.5 text-xs text-gray-400">
                      <Building2 className="w-3 h-3 shrink-0" />{member.affiliation}
                    </span>
                  )}
                </div>
                {member.profile && (
                  <p className="text-xs text-gray-400 mt-1 line-clamp-1">{member.profile}</p>
                )}
              </div>
              <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-blue-400 shrink-0 transition-colors" />
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-white rounded-lg border border-gray-200">
          <Users className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-400">
            {members.length === 0 ? 'メンバーがいません' : '該当するメンバーがいません'}
          </p>
        </div>
      )}
    </div>
  )
}
