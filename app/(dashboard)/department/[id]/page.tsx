import { getSession } from '@/lib/session'
import { createServiceClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { deletePost, updatePost, getPdfSignedUrl } from '@/actions/posts'
import { DeletePostButton } from './DeletePostButton'
import Link from 'next/link'

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
    .from('department_data')
    .select('*')
    .eq('department_id', departmentId)
    .single()

  const { data: writings } = await supabase
    .from('writing_data')
    .select('*')
    .eq('department_id', departmentId)
    .eq('organization_key', session.organizationKey)
    .order('writing_time', { ascending: false })

  function formatDate(timeStr: string) {
    return new Date(timeStr).toLocaleString('ja-JP', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit',
    })
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/posts" className="text-blue-500 hover:underline text-sm">
          ← 最新投稿に戻る
        </Link>
        <h1 className="text-2xl font-bold text-gray-800">
          🏢 {department?.department_name} の投稿履歴
        </h1>
      </div>

      {writings && writings.length > 0 ? (
        <div className="space-y-4">
          {writings.map((post) => (
            <div
              key={post.writing_id}
              className="bg-white rounded-2xl shadow p-5"
            >
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                    <span>👤 {post.user_name_stamp}</span>
                    <span>💼 {post.job_name_stamp}</span>
                    <span className="ml-auto text-xs">
                      🕐 {formatDate(post.writing_time)}
                    </span>
                  </div>
                  <div
                    className="text-gray-800 text-sm leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: post.message }}
                  />
                  {post.pdf_url && (
                    <PdfDownloadButton pdfPath={post.pdf_url} />
                  )}
                </div>
              </div>

              {/* 編集・削除フォーム */}
              <details className="mt-3">
                <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-600">
                  編集 / 削除
                </summary>
                <div className="mt-3 p-4 bg-gray-50 rounded-xl space-y-3">
                  {/* 編集 */}
                  <form action={updatePost as (fd: FormData) => Promise<void>} className="space-y-2">
                    <input type="hidden" name="writingId" value={post.writing_id} />
                    <textarea
                      name="message"
                      defaultValue={post.message.replace(/<[^>]*>/g, '')}
                      rows={3}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 resize-none"
                    />
                    <div className="flex gap-2">
                      <input
                        type="text"
                        name="pin"
                        placeholder="PIN（設定している場合）"
                        className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
                      />
                      <input
                        type="file"
                        name="pdfFile"
                        accept=".pdf"
                        className="text-xs text-gray-500"
                      />
                      <button
                        type="submit"
                        className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 px-4 py-1.5 rounded-lg text-sm font-medium transition"
                      >
                        更新
                      </button>
                    </div>
                  </form>

                  {/* 削除 */}
                  <DeletePostButton
                    action={deletePost}
                    writingId={post.writing_id}
                  />
                </div>
              </details>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center text-gray-400 py-16">
          この部署にはまだ投稿がありません
        </div>
      )}
    </div>
  )
}

/** PDF 署名付き URL を取得してダウンロードリンクを表示 */
async function PdfDownloadButton({ pdfPath }: { pdfPath: string }) {
  const url = await getPdfSignedUrl(pdfPath)
  if (!url) return null

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-2 inline-block text-xs text-red-500 hover:underline"
    >
      📎 PDFを開く
    </a>
  )
}
