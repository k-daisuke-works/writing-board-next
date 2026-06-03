@AGENTS.md

# プロジェクト共通ルール（実際のバグ・ミスから抽出した教訓）

このファイルは「実際に起きたミス」をもとにしたルール集。  
抽象的な推奨ではなく、すべてこのプロジェクトのコミット履歴から引いた実例。

---

## 🔴 セキュリティ（最重要）

### マルチテナントの全 DB クエリに organization_key フィルタ必須
RLS なし = アプリ側フィルタが唯一の防衛線。  
**実際に起きた漏れ：`deleteUser` / `deleteDepartment` / `deleteJob` / `confirmScheduleEvent` / `department/[id]` / `schedule` ページ**

```ts
// すべての SELECT / UPDATE / DELETE に付ける
.eq('organization_key', session.organizationKey)
```

新しい Server Action を書くたびに、全クエリの `.eq()` チェーンを目視確認する。  
特に「削除」「更新」系は漏れやすい（SELECT より意識が薄れる）。

### セットアップ中の未認証エンドポイントに組織存在チェックを入れる
初回セットアップ用のエンドポイントは認証なしでアクセスできる。  
`organizationKey` を推測して第2ユーザーを不正作成される恐れがある。

```ts
// 未認証のセットアップアクション内で必ず確認
if (!session) {
  const { count } = await supabase
    .from('user_info').select('*', { count: 'exact', head: true })
    .eq('organization_key', organizationKey)
  if ((count ?? 0) > 0) return { error: '権限がありません。' }
}
```

---

## 🔴 Next.js ミドルウェア

### middleware.ts の命名は絶対厳守
ファイル名が `middleware.ts` でなければ Next.js に認識されず、**認証ガードが無音で完全無効化**される。  
**実際に起きたこと：デプロイエラー回避のため `proxy.ts` にリネームしたまま放置し、ガードが丸ごと無効だった。**

```ts
// ルート直下 middleware.ts に必ず置く
export async function middleware(request: NextRequest) { ... }
export const config = { matcher: [...] }
```

### PWA manifest を middleware の matcher から除外する
`manifest.webmanifest` を除外しないと、未ログイン状態でPWAインストール時に401エラーになる。  
**実際に起きたこと：ホーム画面追加した端末でアプリが起動しなかった。**

```ts
matcher: ['/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|public|api/).*)'],
```

### パブリックパスのルートマッチは `===` で完全一致
`pathname.startsWith('/')` は全パスにマッチする。  
**実際に起きたこと：`'/'` を PUBLIC_PATHS に加えたとき `startsWith` で全ページが素通りになった。**

```ts
// Bad
PUBLIC_PATHS.some((p) => pathname.startsWith(p))

// Good
PUBLIC_PATHS.some((p) => p === '/' ? pathname === '/' : pathname.startsWith(p))
```

---

## 🔴 日本語入力・文字コード

### ID 系の入力値は必ず NFKC 正規化してからバリデーション
日本語 IME は英数字を全角（ａ・Ａ・１）で入力することがある。  
クライアント正規表現は通るが、サーバーで半角チェックに引っかかり登録できない。  
**実際に起きたこと：ユーザーID・団体ID の登録が「IMEオフにし忘れ」で詰まる問い合わせが頻発。**

```ts
// Server Action の先頭で正規化
const userId = (formData.get('userId') as string)?.normalize('NFKC').trim()
```

### 半角英数字フィールドにはIMEヒントを付ける
```tsx
<input
  type="text"
  name="userId"
  lang="en"
  autoComplete="off"
  autoCorrect="off"
  autoCapitalize="off"
/>
<p className="text-xs text-gray-400 mt-1">半角英数字で入力（IMEをオフに）</p>
```

### 管理フォームのオートコンプリートを抑制する
ブラウザのオートフィルが管理者フォームの入力欄を埋めてしまう。  
**実際に起きたこと：ユーザー登録モーダルで別ユーザーの情報が自動入力された。**

```tsx
<input autoComplete="off" />
<input type="password" autoComplete="new-password" />
```

---

## 🟡 DB クエリ設計

### N+1 クエリを最初から避ける
「部署ごとに最新投稿を1件取得」をループで書くと N 回クエリが発生する。  
**実際に起きたこと：ホームページが部署数分のクエリを発行して遅かった。後から全件取得+JSグルーピングに変更。**

```ts
// Bad: 部署ごとに個別クエリ（N+1）
const posts = await Promise.all(
  departments.map(d => supabase.from('writing_data').select('*').eq('department_id', d.id).limit(1))
)

// Good: 全件1クエリ取得→JSでグルーピング
const { data: allPosts } = await supabase.from('writing_data').select('*')
  .eq('organization_key', orgKey).order('writing_time', { ascending: false }).limit(200)

const deptLatest: Record<number, WritingData> = {}
for (const post of allPosts ?? []) {
  if (post.department_id && !deptLatest[post.department_id]) {
    deptLatest[post.department_id] = post
  }
}
```

### コンポーネントに表示用データを渡す型は、後から追加するカラムを想定しておく
**実際に起きたこと：アバター機能追加後、`PostReplies` コンポーネントに `avatar_url` を渡す仕組みがなく、全ユーザーのアバターがイニシャル表示のままだった。**
- 表示コンポーネントに渡すデータ型に `avatarUrl` 等の拡張余地を prop として最初から持たせる
- 「表示するユーザー情報」は `user_name_stamp` だけでなく `avatar_url` も一緒に扱う設計にする

### コメント入力欄の表示条件に状態依存を入れない
**実際に起きたこと：`(expanded || total === 0)` という条件により、1件でもコメントがあると入力欄が折り畳み状態で非表示になった。**
- 入力欄は常時表示、折り畳みトグルはコメント一覧の表示/非表示だけを制御する

```tsx
// Bad: コメントがあると入力欄が消える
{(expanded || total === 0) && <form>...</form>}

// Good: 常時表示、トグルは一覧のみ制御
{total > 0 && <button onClick={() => setExpanded(v => !v)}>N件のコメント</button>}
<form>...</form>  {/* 常時 */}
```

### SELECT するカラムは使うものだけ明示的に列挙する
`select('*')` を使うとカラムを追加したとき型が自動で広がり、コンポーネントに渡す型と噛み合わなくなる。  
**実際に起きたこと：`avatar_url` を DB に追加したが `select('user_key, user_name')` で取得していなかったため、アバターがずっと表示されなかった。**

```ts
// Bad
supabase.from('user_info').select('user_key, user_name')

// Good（使うカラムを明示）
supabase.from('user_info').select('user_key, user_name, avatar_url')
```

### Optional な FK は `Number(x) || null` で渡す
`<select>` の未選択値は `''` → `Number('') === 0` → DB の外部キーに `0` を渡してエラー。  
**実際に起きたこと：部署・職種未選択のユーザー登録でフリーズ（DBエラーが握りつぶされていた）。**

```ts
const departmentId = Number(formData.get('departmentId')) || null
const jobId        = Number(formData.get('jobId')) || null
```

---

## 🟡 日時・タイムゾーン

### `datetime-local` の値を DB に直接渡さない
`datetime-local` が返す値は `"2026-06-10T14:00"` のようなローカル時刻文字列（タイムゾーン情報なし）。  
DB（UTC）に渡すと表示時に9時間ズレる。  
**実際に起きたこと：日程調整で入力した時刻が全て9時間後ろにズレて表示された。**

```ts
// Bad
formData.append('date', datetimeLocalValue)  // "2026-06-10T14:00"

// Good: クライアントでISO文字列に変換してから送る
formData.append('date', new Date(datetimeLocalValue).toISOString())
```

---

## 🟡 Server Action のエラーハンドリング

### Server Action は throw せず `{ error: string }` を返す
`throw` すると呼び出し元でエラーをキャッチしない限りUIがフリーズする。  
**実際に起きたこと：ユーザー登録 Server Action が例外を throw し、ローディングスピナーが永遠に回り続けた。**

```ts
// Bad
export async function registerUser(fd: FormData) {
  // ...
  throw new Error('登録に失敗しました')  // ← UIフリーズ
}

// Good
export async function registerUser(fd: FormData) {
  // ...
  return { error: '登録に失敗しました。' }
}
```

### 呼び出し側も try-catch でラップする
```ts
try {
  const result = await registerUser(fd)
  if (result?.error) { setError(result.error); return }
  onSuccess()
} catch {
  setError('エラーが発生しました。もう一度お試しください。')
}
```

### DB エラーコードを見てユーザーに意味のあるメッセージを出す
```ts
if (error.code === '23505') return { error: 'このユーザーIDはすでに登録されています。' }
if (error.code === '23503') return { error: '部署または職種の選択に問題があります。' }
return { error: `登録に失敗しました。(${error.code ?? 'unknown'})` }
```

---

## 🟡 URL・リダイレクト

### エラークエリパラメータを組み立てるとき `?` と `&` を判別する
ベースURLにすでに `?` が含まれるかどうかで区切り文字が変わる。  
**実際に起きたこと：`?error=...` を常に `&error=...` にしていたため `/admin&error=xxx` のような壊れた URL になった。**

```ts
// Bad
redirect(`${errorBase}&error=${encodeURIComponent(message)}`)

// Good
const sep = errorBase.includes('?') ? '&' : '?'
redirect(`${errorBase}${sep}error=${encodeURIComponent(message)}`)
```

---

## 🟡 外部サービス・API

### 外部 RSS・画像 URL は事前に実際のリクエストで確認する
公式に見えても 404 が返ることがある。  
**実際に起きたこと：厚生労働省・WAM NET の RSS URL を全部ハードコードしたが、全て 404 だった。Pexels/Unsplash の ID のみ URL も同様に 404。**

- 外部 URL はコード上で使う前にブラウザかcurlで必ず確認する
- 画像CDNは完全な URL 形式（パス含む）を使う（ID のみ形式は不安定）
- 特に政府系 RSS は URL 変更が多い

### VAPID 等の外部ライブラリ設定はモジュールレベルで初期化しない
モジュールロード時に環境変数が未設定だとクラッシュし、全 API が使えなくなる。  
**実際に起きたこと：`webpush.setVapidDetails()` をモジュールトップに書いていたため Vercel へのデプロイが全失敗した。**

```ts
// Bad（モジュールレベル初期化）
webpush.setVapidDetails(process.env.VAPID_SUBJECT!, ...)  // env未設定でクラッシュ

// Good（遅延初期化）
function initVapid(): boolean {
  const subject = process.env.VAPID_SUBJECT
  if (!subject || ...) return false
  webpush.setVapidDetails(subject, ...)
  return true
}
// 使う直前に呼ぶ
if (!initVapid()) return NextResponse.json({ error: 'Push not configured' }, { status: 503 })
```

---

## 🟢 JSX 構文

### JSX 内で配列を直接展開するとき `{[` で始める
**実際に起きたこと：JSX 内の `[` をそのまま書いて構文エラー。ビルドが通らなかった。**

```tsx
// Bad（構文エラー）
return (
  <div>
    [<span>A</span>, <span>B</span>]
  </div>
)

// Good
return (
  <div>
    {[<span key="a">A</span>, <span key="b">B</span>]}
  </div>
)
```

---

## 🟢 モバイル対応

### `justify-center` 単体は小画面でコンテンツが見切れる
**実際に起きたこと：ログインフォーム・セットアップ画面がモバイルで下半分が隠れた。**

```tsx
// Bad
<main className="flex-1 flex flex-col items-center justify-center">

// Good
<main className="flex-1 flex flex-col items-center justify-start lg:justify-center overflow-y-auto">
```

### 横スクロールが必要なコンテンツには `overflow-x-auto` + `min-w-[...]`
iframe・カレンダーグリッド・日程調整テーブルは固定幅になりがち。

```tsx
<div className="overflow-x-auto scrollbar-none">
  <div className="min-w-[350px]">
    {/* テーブルやカレンダー */}
  </div>
</div>
```

### サブナビのタブは `shrink-0` + `overflow-x-auto` で横スクロール可能にする
```tsx
<nav className="flex gap-1 overflow-x-auto scrollbar-none border-b">
  <button className="shrink-0 whitespace-nowrap ...">タブ名</button>
</nav>
```

---

## 🟢 Supabase

### service role クライアントは同期関数・Cookie 不要
```ts
// Good
export function createServiceClient() {
  return createServerClient(url, serviceKey, {
    cookies: { getAll: () => [], setAll: () => {} }
  })
}
```

### `createServiceClient` の呼び出し元は全て `await` しているため非同期→同期変更は後方互換
`await` は非 Promise 値にも使えるので、呼び出し側は変更不要。

---

## 🟢 UI コンポーネント設計

### 新コンポーネントを作る前に既存コンポーネントで対応できないか確認する
**実際に起きたこと：ナビバーにハンバーガーメニューを新設したが、既存の `HomeMenuDropdown` に追加すれば十分だった。後でリファクタが必要になった。**

### 実装前にイメージを確認する
探索的な要件（「〇〇できたらいいな」）は、実装前に2〜3文で提案と確認をする。  
先に実装すると方向性のずれが手戻りになる。

---

## 🟢 .gitignore チェックリスト（新規プロジェクト）

```gitignore
/.next/
*.tsbuildinfo
next-env.d.ts
.env*
.vercel
*.log
dev.log
test_functional.js
screenshots/
/coverage
```

`.vercel` の重複記載、`*.log` の抜け、`screenshots/` 追加忘れは頻出。

---

## 🔴 作業完了時のGit運用

### 変更したら必ずコミット＆プッシュする
実装・修正が終わったら、確認を待たずにコミット＆プッシュまで行う。  
「変更した」＝「コミット＆プッシュした」が完了の定義。

```bash
git add <変更ファイル>
git commit -m "feat/fix/chore: 変更内容の要約"
git push
```

- コミットメッセージは日本語でも英語でも可。変更の「何を・なぜ」を1行で書く
- `git add .` ではなく変更ファイルを明示して `.env` 等の誤コミットを防ぐ
- プッシュ前に `git status` で意図しないファイルが混入していないか確認する

---

## 🟢 コードスタイル

### 共有ユーティリティは `lib/utils.ts` に集約する
同じ関数（`relativeTime` / `isRecent` など）を複数ファイルにコピペしない。  
片方だけ修正する事故が起きる。

### public/ のデフォルトアセットは削除する
```
public/file.svg  public/globe.svg  public/next.svg  public/vercel.svg  public/window.svg
```
`create-next-app` が生成するこれらは未使用。残すと新メンバーが混乱する。

### 架空の統計数字をUIに入れない
「導入施設15+」「稼働率99.9%」のようなでっちあげ数字は後から削除が必要になる。  
**実際に起きたこと：ランディングページに架空の統計バーを作り、すぐ削除することになった。**

---

## 🟡 パフォーマンス

### ページ遷移の体感速度は `loading.tsx` で解決する
App Router はサーバーのデータ取得が終わるまで画面が切り替わらない。  
`loading.tsx` を置くと React Suspense が即座に発動し、スケルトンが見えるため体感が大幅改善する。  
**実際に起きたこと：`loading.tsx` が一切なく、ナビゲーションのたびに画面が数秒フリーズしていた。**

- `app/(dashboard)/loading.tsx` を1つ置けば全ダッシュボードページをカバーできる
- ページ固有のスケルトンが必要なら各ページディレクトリに追加する
- スケルトンは `animate-pulse` + `bg-gray-200` のシンプルな矩形で十分

```tsx
// app/(dashboard)/loading.tsx
function SkeletonCard() {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-5 space-y-3">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-3.5 w-28 bg-gray-200 rounded animate-pulse" />
          <div className="h-3 w-20 bg-gray-200 rounded animate-pulse" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-3.5 bg-gray-200 rounded animate-pulse" />
        <div className="h-3.5 w-4/5 bg-gray-200 rounded animate-pulse" />
      </div>
    </div>
  )
}
export default function Loading() {
  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <div className="h-6 w-44 bg-gray-200 rounded animate-pulse" />
        <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
      </div>
    </div>
  )
}
```

### Server Page の独立クエリは必ず `Promise.all` で並列化する
直列 `await` が残っていないか、実装後に毎回確認する。  
**実際に起きたこと：`posts/page.tsx` で `departments` と `boardPosts` を直列に書いており、片方が終わるまでもう片方が始まらなかった。**

```ts
// Bad: 直列（合計レイテンシ = A + B）
const { data: departments } = await supabase.from('department_data').select('*')...
const { data: boardPosts }  = await supabase.from('writing_data').select('*')...

// Good: 並列（合計レイテンシ = max(A, B)）
const [{ data: departments }, { data: boardPosts }] = await Promise.all([
  supabase.from('department_data').select('*')...,
  supabase.from('writing_data').select('*')...,
])
```

### N+1 クエリを 1クエリ＋JSグルーピングに置き換える
「エンティティごとに最新1件取得」をループで書くと N 回クエリが発生する。  
PostgREST は `DISTINCT ON` 非対応のため、全件取得→JSで先勝ちグルーピングが現実的な解。  
**実際に起きたこと：`posts/page.tsx` が部署数分のクエリを並列発行していた。**

```ts
// Bad: 部署ごとに limit(1) クエリ × N（HTTPラウンドトリップ N 回）
const results = await Promise.all(
  departments.map(d => supabase.from('writing_data')...eq('department_id', d.id).limit(1).maybeSingle())
)

// Good: 1クエリ取得 → JS で最初の出現を取る（ラウンドトリップ 1 回）
const { data: allPosts } = await supabase.from('writing_data').select('*')
  .eq('organization_key', orgKey).eq('post_type', 'board')
  .order('writing_time', { ascending: false })

const deptLatest: Record<number, WritingData> = {}
for (const post of allPosts ?? []) {
  if (post.department_id != null && !deptLatest[post.department_id]) {
    deptLatest[post.department_id] = post
  }
}
```

### 既取得データで補助マップを事前構築し、追加クエリを減らす
ページで既にフェッチしたユーザー情報を再クエリするのは無駄。  
先に既知データでマップを埋めてから、不足分だけ追加クエリする。  
**実際に起きたこと：`home/page.tsx` でチームメンバーのアバターを `membersRaw` で取得済みなのに、reply 著者クエリで再取得していた。**

```ts
// Good: membersRaw（取得済み）と session（取得済み）でまず埋める
const avatarMap: Record<number, string | null> = { [session.userKey]: session.avatarUrl ?? null }
for (const m of teamMembers) avatarMap[m.user_key] = m.avatar_url ?? null

// 未知の著者だけ追加クエリ（多くの場合 0 件で済む）
const unknownKeys = [...new Set(replies.map(r => r.user_key))].filter(k => !(k in avatarMap))
if (unknownKeys.length > 0) {
  const { data } = await supabase.from('user_info').select('user_key, avatar_url').in('user_key', unknownKeys)
  for (const u of data ?? []) avatarMap[u.user_key] = u.avatar_url ?? null
}
```

### Supabase Realtime のチャンネル名には organizationKey を含める
チャンネル名が固定文字列だと、異なる組織のセッションが同一チャンネルに接続してしまう。  
**実際に起きたこと：`'social-realtime'` という固定名を使っており、マルチテナントで競合する設計だった。**

```ts
// Bad
supabase.channel('social-realtime')

// Good
supabase.channel(`social-${organizationKey}`)
```

### Storage の public URL にタイムスタンプを付けない
`?t=${Date.now()}` はキャッシュバスターとして意図されるが、ブラウザキャッシュを完全に無効化する。  
`upsert: true` でファイルを上書きすれば CDN は自然に更新される。  
**実際に起きたこと：アバター URL に毎回異なるクエリパラメータが付き、画像が毎ページロードで再取得されていた。**

```ts
// Bad
avatarUrl = `${data.publicUrl}?t=${Date.now()}`

// Good
avatarUrl = data.publicUrl
```

### `revalidatePath` は変更が波及するすべてのページを列挙する
呼び出したアクションで内容が変わるページを全部書く。書き漏らすと古いキャッシュが残る。  
逆に、関係ないページを巻き込む `'layout'` 型の広域無効化は避ける。  
**実際に起きたこと：`upsertScheduleResponse`（回答送信）に `revalidatePath` がなく、送信後もページが古い状態のままだった。**

```ts
// Bad: 回答送信なのに revalidatePath なし → ページが更新されない
export async function upsertScheduleResponse(fd: FormData) {
  await supabase.from('schedule_responses').upsert(...)
  return { success: true }  // ← キャッシュ無効化を忘れている
}

// Good: 影響するページを明示的に列挙
revalidatePath('/schedule')
revalidatePath('/schedule/calendar')
revalidatePath('/schedule/department')
revalidatePath(`/schedule/${eventId}`)
```

### `next.config.ts` に Supabase Storage の remotePatterns を設定する
設定がないと `<Image>` コンポーネントが Supabase の画像を最適化できず、フォールバックして素の `<img>` 相当になる。

```ts
images: {
  remotePatterns: [
    {
      protocol: 'https',
      hostname: '*.supabase.co',
      pathname: '/storage/v1/object/public/**',
    },
  ],
  formats: ['image/avif', 'image/webp'],
},
```
