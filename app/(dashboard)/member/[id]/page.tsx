import { getSession } from '@/lib/session'
import { createServiceClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { deletePost, updatePost, getPdfSignedUrl } from '@/actions/posts'
import { getPublicMediaUrl } from '@/lib/storage'
import { ExpandableText } from '@/app/(dashboard)/components/ExpandableText'
import { DeletePostButton } from '@/app/(dashboard)/department/[id]/DeletePostButton'
import Link from 'next/link'
import { ArrowLeft, Clock, Paperclip, User, ChevronDown } from 'lucide-react'

type SA = (fd: FormData) => Promise<void>
const toAction = (fn: (fd: FormData) => unknown) => fn as unknown as SA

export default async function MemberHistoryPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await getSession()
  if (!session) redirect('/login')

  const { id } = await params
  const userId = Number(id)
  const supabase = await createServiceClient()

  const [{ data: member }, { data: posts }] = await Promise.all([
    supabase.from('user_info').select('user_name').eq('user_key', userId).single(),
    supabase.from('writing_data').select('*')
      .eq('user_key', userId)
      .eq('organization_key', session.organizationKey)
      .eq('post_type', 'team')
      .order('writing_time', { ascending: false }),
  ])

  function fmt(t: string) {
    return new Date(t).toLocaleString('ja-JP', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit',
    })
  }

  return (
    <div className="anim-fade-in max-w-3xl">
      <div className="mb-6">
        <Link href="/home" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-blue-600 transition-colors mb-3 w-fit">
          <ArrowLeft className="w-4 h-4" />
          ホームに戻る
        </Link>
        <h1 className="text-xl font-semibold text-gray-900">{member?.user_name ?? 'メンバー'}</h1>
        <p className="text-sm text-gray-400 mt-0.5">{posts?.length ?? 0}件の投稿</p>
      </div>

      {posts && posts.length > 0 ? (
        <div className="space-y-2.5">
          {posts.map((post) => (
            <div key={post.writing_id} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              {/* 投稿ヘッダー */}
              <div className="flex items-center gap-3 px-4 sm:px-5 py-3 sm:py-3.5 border-b border-gray-100">
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                  {post.user_name_stamp.slice(0, 1)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-gray-900">{post.user_name_stamp}</span>
                    <span className="text-xs text-gray-400">{post.job_name_stamp}</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
                    <Clock className="w-3 h-3" />
                    {fmt(post.writing_time)}
                  </div>
                </div>
              </div>

              {/* 本文 */}
              <div className="px-4 sm:px-5 py-4 space-y-3">
                <ExpandableText text={post.message} className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap" />

                {/* 画像 */}
                {post.image_url && (
                  <img
                    src={getPublicMediaUrl('images', post.image_url)}
                    alt=""
                    className="rounded-lg max-w-sm w-full border border-gray-100"
                  />
                )}

                {/* 動画 */}
                {post.video_url && (
                  <video
                    src={getPublicMediaUrl('videos', post.video_url)}
                    controls
                    className="rounded-lg max-w-sm w-full"
                  />
                )}

                {/* PDF */}
                {post.pdf_url && <PdfDownloadButton pdfPath={post.pdf_url} />}
              </div>

              {/* 編集・削除 */}
              <details className="border-t border-gray-100">
                <summary className="flex items-center gap-1.5 px-5 py-2.5 text-xs text-gray-400 cursor-pointer hover:bg-gray-50 hover:text-gray-600 transition-colors list-none select-none group">
                  <ChevronDown className="w-3.5 h-3.5 group-open:rotate-180 transition-transform" />
                  編集 / 削除
                </summary>
                <div className="bg-gray-50 px-4 sm:px-5 py-4 space-y-3 border-t border-gray-100">
                  <form action={toAction(updatePost)} className="space-y-2.5">
                    <input type="hidden" name="writingId" value={post.writing_id} />
                    <textarea name="message" defaultValue={post.message}
                      rows={3}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 resize-none transition-colors bg-white" />
                    <div className="flex gap-2 flex-wrap">
                      <input type="text" name="pin" placeholder="PIN"
                        className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition-colors bg-white w-32" />
                      <label className="flex items-center gap-1.5 border border-gray-300 rounded-md px-3 py-1.5 cursor-pointer hover:bg-white transition-colors text-sm text-gray-500">
                        <Paperclip className="w-3.5 h-3.5" />PDF
                        <input type="file" name="pdfFile" accept=".pdf" className="sr-only" />
                      </label>
                      <button type="submit"
                        className="bg-yellow-400 hover:bg-yellow-500 text-yellow-900 px-4 py-1.5 rounded-md text-xs font-semibold transition-colors">
                        更新
                      </button>
                    </div>
                  </form>
                  <DeletePostButton action={deletePost} writingId={post.writing_id} />
                </div>
              </details>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-white rounded-lg border border-gray-200">
          <User className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-400">まだ投稿がありません</p>
        </div>
      )}
    </div>
  )
}

async function PdfDownloadButton({ pdfPath }: { pdfPath: string }) {
  const url = await getPdfSignedUrl(pdfPath)
  if (!url) return null
  return (
    <a href={url} target="_blank" rel="noopener noreferrer"
       className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 transition-colors">
      <Paperclip className="w-3.5 h-3.5" />PDFを開く
    </a>
  )
}
