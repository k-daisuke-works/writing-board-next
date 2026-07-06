---
name: lessons
description: 過去に実際に起きたバグ・ミスから抽出した詳細パターン集（コード例・経緯つき）。DBクエリ設計、パフォーマンス改善、Server Action、日時処理、外部API連携、フォーム実装に着手する前に該当セクションを読む。CLAUDE.md の要約ルールの背景・実装例はここにある。
---

# 実バグ由来の詳細パターン集

CLAUDE.md の要約ルールに対応する、実際のコード例と発生経緯。

## セキュリティ

### organization_key フィルタ漏れの実例
過去に漏れた箇所：`deleteUser` / `deleteDepartment` / `deleteJob` / `confirmScheduleEvent` / `department/[id]` / `schedule` ページ。
削除・更新系は SELECT より意識が薄れて漏れやすい。新しい Server Action を書くたびに全クエリの `.eq()` チェーンを目視確認する。

### 未認証セットアップの組織存在チェック
`organizationKey` を推測して第2ユーザーを不正作成される恐れがある。

```ts
if (!session) {
  const { count } = await supabase
    .from('user_info').select('*', { count: 'exact', head: true })
    .eq('organization_key', organizationKey)
  if ((count ?? 0) > 0) return { error: '権限がありません。' }
}
```

## Next.js ミドルウェア

- **`middleware.ts` 命名厳守**：デプロイエラー回避のため `proxy.ts` にリネームしたまま放置し、認証ガードが丸ごと無効だったことがある。
- **matcher から `manifest.webmanifest` を除外**：しないと未ログインのPWAインストールが401になり、ホーム画面追加した端末でアプリが起動しなかった。
  ```ts
  matcher: ['/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|public|api/).*)'],
  ```
- **パブリックパスの `'/'` は完全一致**：`startsWith('/')` は全パスにマッチし、全ページ素通りになった。
  ```ts
  PUBLIC_PATHS.some((p) => p === '/' ? pathname === '/' : pathname.startsWith(p))
  ```

## 日本語入力・文字コード

### NFKC 正規化
IME で全角英数字（ａ・Ａ・１）が入力され、ユーザーID・団体ID の登録が詰まる問い合わせが頻発した。

```ts
const userId = (formData.get('userId') as string)?.normalize('NFKC').trim()
```

### IMEヒント・オートコンプリート抑制
ユーザー登録モーダルで別ユーザーの情報が自動入力されたことがある。

```tsx
<input type="text" name="userId" lang="en"
  autoComplete="off" autoCorrect="off" autoCapitalize="off" />
<p className="text-xs text-gray-400 mt-1">半角英数字で入力（IMEをオフに）</p>
<input type="password" autoComplete="new-password" />
```

## DB クエリ設計・パフォーマンス

### N+1 → 1クエリ＋JSグルーピング
「部署ごとに最新投稿1件」をループ/`Promise.all` で書くと N 回の HTTP ラウンドトリップが発生する（`posts/page.tsx` で実際に発生）。PostgREST は `DISTINCT ON` 非対応のため、全件取得→JSで先勝ちグルーピングが現実的な解。

```ts
// Good: 1クエリ取得 → JS で最初の出現を取る
const { data: allPosts } = await supabase.from('writing_data').select('*')
  .eq('organization_key', orgKey).eq('post_type', 'board')
  .order('writing_time', { ascending: false }).limit(200)

const deptLatest: Record<number, WritingData> = {}
for (const post of allPosts ?? []) {
  if (post.department_id != null && !deptLatest[post.department_id]) {
    deptLatest[post.department_id] = post
  }
}
```

### 独立クエリの並列化
`posts/page.tsx` で `departments` と `boardPosts` を直列 `await` していた。実装後に直列 `await` が残っていないか毎回確認する。

```ts
const [{ data: departments }, { data: boardPosts }] = await Promise.all([...])
```

### 既取得データで補助マップを事前構築
`home/page.tsx` で取得済みの `membersRaw` があるのに reply 著者を再クエリしていた。

```ts
const avatarMap: Record<number, string | null> = { [session.userKey]: session.avatarUrl ?? null }
for (const m of teamMembers) avatarMap[m.user_key] = m.avatar_url ?? null
const unknownKeys = [...new Set(replies.map(r => r.user_key))].filter(k => !(k in avatarMap))
if (unknownKeys.length > 0) { /* 不足分だけ追加クエリ */ }
```

### SELECT カラムの明示列挙
`avatar_url` を DB に追加したが `select('user_key, user_name')` のままで、アバターがずっと表示されなかった。表示用ユーザー情報は `user_name` だけでなく `avatar_url` も一緒に扱う。コンポーネントに渡す型にも `avatarUrl` 等の拡張余地を最初から持たせる。

**セキュリティ面の実害も起きた**: 管理画面が `user_info` を `select('*')` で取得しクライアントコンポーネントに渡していたため、bcryptパスワードハッシュが全ユーザー分ブラウザに送出されていた。さらに `email` カラムを追加した際、`select('*')` の範囲が自動で広がり漏洩が拡大した。**機密カラムを持つテーブル（user_info・organization_data）でクライアントに渡すデータは必ずカラム明示列挙**。クライアントに渡る型（`UserInfo` 等）には `password` を含めない。

### Optional FK
`<select>` 未選択 `''` → `Number('') === 0` → FK違反でユーザー登録がフリーズした。

```ts
const departmentId = Number(formData.get('departmentId')) || null
```

### コメント入力欄の表示条件
`(expanded || total === 0)` により、コメントが1件でもあると入力欄が消えた。入力欄は常時表示、トグルは一覧の表示/非表示のみ制御する。

## 日時・タイムゾーン

`datetime-local` の値 `"2026-06-10T14:00"` はタイムゾーン情報なし。DB（UTC）に直接渡すと表示が9時間ズレる（日程調整で実際に発生）。

```ts
formData.append('date', new Date(datetimeLocalValue).toISOString())
```

## Server Action のエラーハンドリング

throw するとローディングスピナーが永遠に回り続けた（ユーザー登録で実際に発生）。

```ts
// Server Action 側
return { error: '登録に失敗しました。' }  // throw しない

// DBエラーコードで意味のあるメッセージ
if (error.code === '23505') return { error: 'このユーザーIDはすでに登録されています。' }
if (error.code === '23503') return { error: '部署または職種の選択に問題があります。' }
return { error: `登録に失敗しました。(${error.code ?? 'unknown'})` }

// 呼び出し側
try {
  const result = await someAction(fd)
  if (result?.error) { setError(result.error); return }
  onSuccess()
} catch {
  setError('エラーが発生しました。もう一度お試しください。')
}
```

## URL・リダイレクト

`?error=...` を常に `&error=...` にしていて `/admin&error=xxx` になった。

```ts
const sep = errorBase.includes('?') ? '&' : '?'
redirect(`${errorBase}${sep}error=${encodeURIComponent(message)}`)
```

## revalidatePath

`upsertScheduleResponse`（回答送信）に `revalidatePath` がなく、送信後もページが古いままだった。影響するページを全列挙する。広域の `'layout'` 型無効化は避ける。

```ts
revalidatePath('/schedule')
revalidatePath('/schedule/calendar')
revalidatePath('/schedule/department')
revalidatePath(`/schedule/${eventId}`)
```

## 外部サービス・API

- **外部 RSS・画像 URL は使用前に curl で実在確認**：厚労省・WAM NET の RSS URL を全部ハードコードしたが全て404だった。画像CDNは完全URL形式を使う（IDのみ形式は不安定）。政府系RSSはURL変更が多い。
- **外部ライブラリはモジュールレベルで初期化しない**：`webpush.setVapidDetails()` をモジュールトップに書いて Vercel デプロイが全失敗した。

```ts
function initVapid(): boolean {
  const subject = process.env.VAPID_SUBJECT
  if (!subject || ...) return false
  webpush.setVapidDetails(subject, ...)
  return true
}
if (!initVapid()) return NextResponse.json({ error: 'Push not configured' }, { status: 503 })
```

## Supabase 固有

- **Realtime チャンネル名に organizationKey を含める**：固定名 `'social-realtime'` だと異なる組織が同一チャンネルに接続する。→ `` supabase.channel(`social-${organizationKey}`) ``
- **Storage public URL に `?t=${Date.now()}` を付けない**：ブラウザキャッシュが完全無効化され、アバターが毎ページロードで再取得されていた。`upsert: true` で上書きすればCDNは自然に更新される。
- **service role クライアントは同期関数・Cookie 不要**：
  ```ts
  export function createServiceClient() {
    return createServerClient(url, serviceKey, {
      cookies: { getAll: () => [], setAll: () => {} }
    })
  }
  ```
- **`next.config.ts` に Supabase Storage の remotePatterns 設定**：ないと `<Image>` が最適化できない。
  ```ts
  images: {
    remotePatterns: [{ protocol: 'https', hostname: '*.supabase.co', pathname: '/storage/v1/object/public/**' }],
    formats: ['image/avif', 'image/webp'],
  },
  ```

## UI・体感速度

### loading.tsx でページ遷移の体感改善
`loading.tsx` が一切なく、ナビゲーションのたびに画面が数秒フリーズしていた。`app/(dashboard)/loading.tsx` を1つ置けば全ダッシュボードページをカバー。スケルトンは `animate-pulse` + `bg-gray-200` の矩形で十分。

### JSX 内の配列展開
JSX 内の `[` をそのまま書いて構文エラーになった。`{[<span key="a">A</span>, ...]}` のように `{[` で始める。

### コンポーネント設計
- ナビバーにハンバーガーメニューを新設したが、既存の `HomeMenuDropdown` に追加すれば十分で後からリファクタになった。新設前に既存確認。
- ランディングページに架空の統計バー（「導入施設15+」等）を作り、すぐ削除することになった。

## .gitignore チェックリスト（新規プロジェクト時）

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
