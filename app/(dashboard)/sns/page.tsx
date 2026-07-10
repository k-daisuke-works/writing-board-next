import { getSession } from '@/lib/session'
import { createServiceClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Camera, ExternalLink, Film, Images } from 'lucide-react'
import { fmtShortDate } from '@/lib/utils'
import type { InstagramPost } from '@/types/database'

export default async function SnsPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  const supabase = createServiceClient()

  const [{ data: account }, { data: postsRaw }] = await Promise.all([
    supabase.from('instagram_accounts')
      .select('account_name, updated_at')
      .eq('organization_key', session.organizationKey)
      .maybeSingle(),
    supabase.from('instagram_posts')
      .select('id, media_id, caption, media_type, media_url, thumbnail_url, permalink, posted_at')
      .eq('organization_key', session.organizationKey)
      .order('posted_at', { ascending: false, nullsFirst: false })
      .limit(24),
  ])

  const posts = (postsRaw ?? []) as InstagramPost[]

  return (
    <div className="anim-fade-in max-w-3xl">
      <div className="mb-5">
        <h1 className="flex items-center gap-2 text-xl font-bold text-gray-900">
          <Camera className="w-5 h-5 text-pink-600" />
          {account?.account_name ? `${account.account_name} の発信` : '会のInstagram'}
        </h1>
        <p className="mt-1 text-sm text-gray-500">会の公式Instagramの投稿を表示しています</p>
      </div>

      {!account ? (
        <div className="rounded-xl border border-gray-200 bg-white p-8 text-center">
          <Camera className="mx-auto mb-3 w-8 h-8 text-gray-300" />
          <p className="text-sm text-gray-600">Instagramアカウントがまだ連携されていません</p>
          <p className="mt-1 text-xs text-gray-400">
            {session.role === 'admin'
              ? '連携手順は運営者にお問い合わせください（管理者向け設定作業が必要です）'
              : '管理者にお問い合わせください'}
          </p>
        </div>
      ) : posts.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-500">
          投稿の取得待ちです。しばらくしてからもう一度開いてください（1日2回自動更新されます）
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3">
            {posts.map(post => {
              const imgSrc = post.media_type === 'VIDEO'
                ? (post.thumbnail_url ?? post.media_url)
                : (post.media_url ?? post.thumbnail_url)
              return (
                <a
                  key={post.media_id}
                  href={post.permalink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group overflow-hidden rounded-xl border border-gray-200 bg-white transition-shadow hover:shadow-md"
                >
                  <div className="relative aspect-square bg-gray-100">
                    {imgSrc ? (
                      // eslint-disable-next-line @next/next/no-img-element -- Instagram CDN の失効性URLのため next/image 最適化を通さない
                      <img
                        src={imgSrc}
                        alt={post.caption?.slice(0, 40) ?? 'Instagram投稿'}
                        loading="lazy"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="grid h-full w-full place-items-center text-gray-300">
                        <Camera className="w-8 h-8" />
                      </div>
                    )}
                    {post.media_type === 'VIDEO' && (
                      <span className="absolute right-1.5 top-1.5 rounded-full bg-black/50 p-1 text-white"><Film className="w-3.5 h-3.5" /></span>
                    )}
                    {post.media_type === 'CAROUSEL_ALBUM' && (
                      <span className="absolute right-1.5 top-1.5 rounded-full bg-black/50 p-1 text-white"><Images className="w-3.5 h-3.5" /></span>
                    )}
                  </div>
                  <div className="p-2.5">
                    {post.caption && (
                      <p className="line-clamp-2 text-xs leading-4 text-gray-700">{post.caption}</p>
                    )}
                    <p className="mt-1 flex items-center gap-1 text-[10px] text-gray-400">
                      {post.posted_at && <span>{fmtShortDate(post.posted_at)}</span>}
                      <ExternalLink className="w-2.5 h-2.5" />
                    </p>
                  </div>
                </a>
              )
            })}
          </div>
          <p className="mt-4 text-center text-[11px] text-gray-400">
            画像は Instagram（Meta）のサーバーから読み込まれます・タップで Instagram の投稿を開きます
          </p>
        </>
      )}
    </div>
  )
}
