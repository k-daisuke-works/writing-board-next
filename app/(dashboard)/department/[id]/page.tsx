import { getSession } from '@/lib/session'
import { createServiceClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { deletePost, updatePost, getPdfSignedUrl } from '@/actions/posts'
import { DeletePostButton } from './DeletePostButton'
import Link from 'next/link'

type SA = (fd: FormData) => Promise<void>
const toAction = (fn: (fd: FormData) => unknown) => fn as unknown as SA

export default async function DepartmentHistoryPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await getSession()
  if (!session) redirect('/login')

  const { id } = await params
  const departmentId = Number(id)
  const supabase = await createServiceClient()

  const { data: department } = await supabase
    .from('department_data').select('*').eq('department_id', departmentId).single()

  const { data: writings } = await supabase
    .from('writing_data').select('*')
    .eq('department_id', departmentId)
    .eq('organization_key', session.organizationKey)
    .order('writing_time', { ascending: false })

  function formatDate(t: string) {
    return new Date(t).toLocaleString('ja-JP', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit',
    })
  }

  return (
    <div>
      {/* ヘッダー */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/posts"
          className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-indigo-500 transition-colors"
        >
          ← 連絡ボードに戻る
        </Link>
        <span className="text-slate-200">/</span>
        <h1 className="text-lg font-bold text-slate-800 tracking-tight">
          {department?.department_name}
        </h1>
      </div>

      {writings && writings.length > 0 ? (
        <div className="space-y-3">
          {writings.map((post) => (
            <div key={post.writing_id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              {/* 投稿ヘッダー */}
              <div className="flex items-center gap-3 px-5 pt-4 pb-3 border-b border-slate-50">
                <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-xs font-bold text-indigo-600 shrink-0">
                  {post.user_name_stamp.slice(0, 1)}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="font-medium text-sm text-slate-700">{post.user_name_stamp}</span>
                  <span className="text-xs text-slate-400 ml-2">{post.job_name_stamp}</span>
                </div>
                <span className="text-xs text-slate-300 shrink-0">{formatDate(post.writing_time)}</span>
              </div>

              {/* 本文 */}
              <div className="px-5 py-4">
                <div
                  className="text-sm text-slate-700 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: post.message }}
                />
                {post.pdf_url && <PdfDownloadButton pdfPath={post.pdf_url} />}
              </div>

              {/* 編集・削除（折りたたみ） */}
              <details className="border-t border-slate-50 group">
                <summary className="flex items-center gap-1.5 px-5 py-2.5 text-xs text-slate-300 cursor-pointer hover:text-slate-500 transition-colors list-none select-none">
                  <span className="group-open:rotate-90 transition-transform inline-block">▶</span>
                  編集 / 削除
                </summary>
                <div className="px-5 pb-5 pt-3 bg-slate-50/50 space-y-3">
                  {/* 編集 */}
                  <form action={toAction(updatePost)} className="space-y-2">
                    <input type="hidden" name="writingId" value={post.writing_id} />
                    <textarea
                      name="message"
                      defaultValue={post.message.replace(/<[^>]*>/g, '')}
                      rows={3}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-400 resize-none transition"
                    />
                    <div className="flex gap-2">
                      <input
                        type="text" name="pin"
                        placeholder="PIN（設定している場合）"
                        className="flex-1 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-400 transition"
                      />
                      <input type="file" name="pdfFile" accept=".pdf" className="text-xs text-slate-400 self-center" />
                      <button
                        type="submit"
                        className="bg-amber-400 hover:bg-amber-500 text-amber-900 px-4 py-2 rounded-xl text-xs font-semibold transition-colors"
                      >
                        更新
                      </button>
                    </div>
                  </form>

                  {/* 削除 */}
                  <DeletePostButton action={deletePost} writingId={post.writing_id} />
                </div>
              </details>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <div className="text-4xl mb-3">📭</div>
          <p className="text-sm text-slate-300">この部署にはまだ投稿がありません</p>
        </div>
      )}
    </div>
  )
}

async function PdfDownloadButton({ pdfPath }: { pdfPath: string }) {
  const url = await getPdfSignedUrl(pdfPath)
  if (!url) return null
  return (
    <a
      href={url} target="_blank" rel="noopener noreferrer"
      className="mt-3 inline-flex items-center gap-1.5 text-xs text-rose-400 hover:text-rose-600 transition-colors"
    >
      📎 PDFを開く
    </a>
  )
}
