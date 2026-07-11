import { getSession } from '@/lib/session'
import { createOrgClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { FolderOpen, Image as ImageIcon, Film, FileText, LayoutGrid } from 'lucide-react'
import { PageHeading } from '@/app/(dashboard)/components/PageHeading'
import PostAttachments from '@/app/(dashboard)/components/PostAttachments'
import { ExpandableText } from '@/app/(dashboard)/components/ExpandableText'
import { fmtShortDate } from '@/lib/utils'
import type { PostAttachment, WritingData } from '@/types/database'

type FileType = 'image' | 'video' | 'pdf'

const TABS = [
  { key: 'all', label: 'すべて', Icon: LayoutGrid },
  { key: 'image', label: '画像', Icon: ImageIcon },
  { key: 'video', label: '動画', Icon: Film },
  { key: 'pdf', label: 'PDF', Icon: FileText },
] as const

const POST_TYPE_LABEL: Record<string, string> = {
  board: '全体掲示板',
  team: 'チーム投稿',
  notice: 'お知らせ',
}

/** 投稿が持つファイル種別の集合（複数添付＋旧形式の単一添付カラムを統合） */
function fileTypesOf(post: LegacyPost, attachments: PostAttachment[]): Set<FileType> {
  const types = new Set<FileType>(attachments.map(a => a.file_type))
  if (post.image_url) types.add('image')
  if (post.video_url) types.add('video')
  if (post.pdf_url) types.add('pdf')
  return types
}

type LegacyPost = Pick<
  WritingData,
  'writing_id' | 'message' | 'user_name_stamp' | 'department_name_stamp' | 'department_id'
  | 'post_type' | 'writing_time' | 'image_url' | 'video_url' | 'pdf_url'
>

const POST_COLUMNS =
  'writing_id, message, user_name_stamp, department_name_stamp, department_id, post_type, writing_time, image_url, video_url, pdf_url'

export default async function DocumentsPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>
}) {
  const session = await getSession()
  if (!session) redirect('/login')

  const { type } = await searchParams
  const activeTab = TABS.some(t => t.key === type) ? (type as FileType | 'all') : 'all'

  const supabase = await createOrgClient(session.organizationKey)

  // 複数添付テーブルと旧形式（writing_data の単一添付カラム）の両方から資料つき投稿を集める
  const [{ data: attachmentsRaw }, { data: legacyPostsRaw }] = await Promise.all([
    supabase.from('post_attachments')
      .select('id, post_id, organization_key, file_type, url, created_at')
      .eq('organization_key', session.organizationKey)
      .order('created_at', { ascending: false })
      .limit(500),
    supabase.from('writing_data')
      .select(POST_COLUMNS)
      .eq('organization_key', session.organizationKey)
      .or('image_url.not.is.null,video_url.not.is.null,pdf_url.not.is.null')
      // 閲覧範囲は既存ページと同じ: board は組織全体、team / notice は自部署のみ
      .or(`post_type.eq.board,department_id.eq.${session.departmentId}`)
      .order('writing_time', { ascending: false })
      .limit(200),
  ])

  const attachments = (attachmentsRaw ?? []) as PostAttachment[]
  const attachmentsMap: Record<number, PostAttachment[]> = {}
  for (const a of attachments) {
    if (!attachmentsMap[a.post_id]) attachmentsMap[a.post_id] = []
    attachmentsMap[a.post_id].push(a)
  }

  const postsById = new Map<number, LegacyPost>()
  for (const p of (legacyPostsRaw ?? []) as LegacyPost[]) postsById.set(p.writing_id, p)

  // 添付テーブルにはあるが旧カラムが空の投稿（本文情報が未取得）を補完
  const missingIds = Object.keys(attachmentsMap).map(Number).filter(id => !postsById.has(id))
  if (missingIds.length > 0) {
    const { data: extra } = await supabase.from('writing_data')
      .select(POST_COLUMNS)
      .eq('organization_key', session.organizationKey)
      .in('writing_id', missingIds)
    for (const p of (extra ?? []) as LegacyPost[]) postsById.set(p.writing_id, p)
  }

  const posts = [...postsById.values()]
    // 添付テーブル経由で拾った投稿にも閲覧範囲を適用（board 以外は自部署のみ）
    .filter(p => p.post_type === 'board' || p.department_id === session.departmentId)
    .sort((a, b) => (a.writing_time < b.writing_time ? 1 : -1))
    .filter(p => {
      if (activeTab === 'all') return true
      return fileTypesOf(p, attachmentsMap[p.writing_id] ?? []).has(activeTab)
    })
    .slice(0, 100)

  return (
    <div className="anim-fade-in max-w-3xl">
      <PageHeading
        Icon={FolderOpen} iconBg="bg-amber-50" iconColor="text-amber-600"
        title="資料庫"
        subtitle="投稿に添付された資料・写真・動画を横断で確認できます"
      />

      <div className="mb-4 flex gap-1.5 overflow-x-auto scrollbar-none">
        {TABS.map(({ key, label, Icon }) => (
          <Link
            key={key}
            href={key === 'all' ? '/documents' : `/documents?type=${key}`}
            className={`flex min-h-[40px] shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-4 text-sm transition-colors ${
              activeTab === key
                ? 'bg-[#001e5a] font-bold text-white'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </Link>
        ))}
      </div>

      {posts.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-500">
          {activeTab === 'all' ? 'まだ資料つきの投稿がありません' : 'この種類の資料はまだありません'}
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map(post => (
            <div key={post.writing_id} className="rounded-xl border border-gray-200 bg-white p-4 sm:p-5">
              <div className="mb-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-gray-400">
                <span className="font-medium text-gray-600">{post.user_name_stamp}</span>
                {post.department_name_stamp && <span>{post.department_name_stamp}</span>}
                <span>{fmtShortDate(post.writing_time)}</span>
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] text-gray-500">
                  {POST_TYPE_LABEL[post.post_type ?? 'board'] ?? '投稿'}
                </span>
              </div>
              <ExpandableText text={post.message} className="text-sm text-gray-700" />
              <PostAttachments post={post} attachments={attachmentsMap[post.writing_id] ?? []} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
