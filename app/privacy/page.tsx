import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { RoScopeLogo } from '@/app/components/RoScopeLogo'

export const metadata = { title: 'プライバシーポリシー | RoScope' }

const NAVY = '#001e5a'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="font-maru font-extrabold text-lg mb-3" style={{ color: NAVY }}>{title}</h2>
      <div className="text-sm text-gray-600 leading-relaxed space-y-2">{children}</div>
    </section>
  )
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen" style={{ background: '#faf7ee' }}>
      <header className="bg-white/90 backdrop-blur border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-5 h-16 flex items-center justify-between">
          <Link href="/" aria-label="RoScope トップへ"><RoScopeLogo size="sm" /></Link>
          <Link href="/" className="inline-flex items-center gap-1.5 min-h-[44px] px-3 text-sm text-gray-500 hover:text-gray-800">
            <ArrowLeft className="w-4 h-4" />トップへ戻る
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-5 py-10">
        <div className="bg-white rounded-[28px] px-6 py-8 sm:px-10 sm:py-10 shadow-sm">
          <h1 className="font-maru font-extrabold text-2xl mb-2" style={{ color: NAVY }}>プライバシーポリシー</h1>
          <p className="text-xs text-gray-400 mb-8">制定日: 2026年7月10日（最終改定: 2026年7月11日）</p>

          <Section title="1. 本ポリシーについて">
            <p>
              本ポリシーは、チーム情報共有ボード「RoScope」（以下「本システム」）における個人情報の取扱いを定めるものです。
              本システムは複数の団体が利用でき、各利用団体が自団体の会員・メンバーの個人情報を管理する主体（個人情報取扱事業者）となります。
              本システムの運営者は、システムの提供・保守に必要な範囲で、利用団体からの委託に準じてデータを取り扱います。
            </p>
          </Section>

          <Section title="2. 取得する情報">
            <ul className="list-disc list-inside space-y-1">
              <li>アカウント情報：ユーザーID、氏名（ユーザー名）、所属団体・班（部署）・職種・役職・雇用形態、権限</li>
              <li>任意登録情報：プロフィール画像、所属、自己紹介、社会福祉士会会員番号、メールアドレス（管理者のパスワード再設定用）</li>
              <li>利用情報：投稿・コメント・リアクション・既読状況、添付ファイル、日程調整の回答、メンバー間のダイレクトメッセージ（DM）</li>
              <li>セキュリティ情報：ログイン履歴（日時・IPアドレス）、操作の監査ログ、プッシュ通知の購読情報</li>
              <li>外部連携情報：所属団体の公式 Instagram アカウントの投稿内容（画像・動画サムネイル・キャプション・投稿日時）。サーバー側で Instagram API から取得し、本システム内に表示するために保存します</li>
            </ul>
          </Section>

          <Section title="3. 利用目的">
            <ul className="list-disc list-inside space-y-1">
              <li>団体内の情報共有・連絡・日程調整など、本システムの機能提供のため</li>
              <li>本人確認・認証・アカウント管理のため</li>
              <li>社会福祉士会会員番号は、活動費請求フォームへの入力補助のため</li>
              <li>不正アクセスの検知・防止、障害対応、利用状況の監査のため</li>
              <li>ダイレクトメッセージのトラブル報告があった場合に、利用団体の管理者が該当スレッドを確認するため</li>
            </ul>
          </Section>

          <Section title="4. 第三者提供">
            <p>
              法令に基づく場合を除き、本人の同意なく個人情報を第三者に提供しません。
            </p>
            <p>
              メンバー間のダイレクトメッセージ（DM）の内容は、通常のシステム機能を通じては運営者・利用団体の管理者を含む第三者が閲覧できない設計としており、
              保守・障害対応のためデータベースへ直接アクセスする権限を持つ運営者も、保守目的以外でこれにアクセスしません。
              当事者の一方が「管理者に報告」の操作を行った場合に限り、当該スレッドの内容が利用団体の管理者に開示されます
              （利用団体内部での確認であり、外部への提供は行いません）。
              開示の操作と管理者による閲覧は、いずれも監査ログに記録されます。
            </p>
          </Section>

          <Section title="5. 外部サービスの利用とデータの保管場所">
            <p>
              本システムは、データの保管にクラウドサービス（Supabase）、システムの配信にホスティングサービス（Vercel）を利用しています。
              これらの事業者が保管データを独自の目的で取り扱うことはありません。
            </p>
            <p>
              活動費請求の機能では Google フォームを利用しており、請求ページを開いた際に、入力補助のため登録済みの社会福祉士会会員番号が Google に送信されます。
              また、フォームに入力・送信した内容は Google のサービスに保存されます。
            </p>
            <p>
              所属団体の公式 Instagram の投稿を表示する機能では、投稿の画像を表示する際に、お使いの端末から Meta Platforms, Inc.（Instagram）のサーバーへ直接アクセスして画像を読み込みます。
              このとき、画像配信のために IP アドレス等の通信情報が Meta 社に送信されます。送信された情報は Meta 社のプライバシーポリシーに基づき取り扱われ、前段の「独自の目的で取り扱うことはありません」の対象には含まれません。
            </p>
            <p>
              データベースおよびアップロードされたファイルは、日本国内（東京リージョン）のデータセンターに保管されています。
              また、障害からの復旧に備えてデータベースの内容（ダイレクトメッセージを含む）を日次でバックアップし、
              同じ国内データセンターの非公開領域に14日間保管しています。
            </p>
          </Section>

          <Section title="6. 安全管理措置">
            <ul className="list-disc list-inside space-y-1">
              <li>通信はすべて暗号化（HTTPS）しています</li>
              <li>パスワードはハッシュ化して保存し、平文では保持しません</li>
              <li>団体ごとにデータを分離し、他団体からアクセスできない設計としています</li>
              <li>3段階の権限管理（管理者・リーダー・メンバー）でアクセス範囲を制御しています</li>
              <li>セキュリティ上重要な操作は監査ログに記録しています</li>
              <li>ログインセッションは8時間で自動失効します</li>
            </ul>
          </Section>

          <Section title="7. 開示・訂正・削除の請求">
            <p>
              ご自身の個人情報の開示・訂正・利用停止・削除を希望される場合は、所属団体の管理者にお申し出ください。
              プロフィール情報の一部（画像・所属・自己紹介・会員番号）はご自身で編集できます。
              アカウントが削除された場合、認証情報は無効化されます。
            </p>
            <p>
              ダイレクトメッセージは会話の性質上、相手方のデータでもあるため、いずれかの当事者のアカウントが削除されると、
              スレッド全体（双方のメッセージ）が削除されます。
            </p>
          </Section>

          <Section title="8. 本ポリシーの改定">
            <p>
              本ポリシーを改定する場合は、本ページでお知らせします。重要な変更がある場合は、システム内の掲示板でも周知します。
            </p>
          </Section>

          <p className="text-xs text-gray-400 mt-10">
            関連: <Link href="/terms" className="underline hover:text-gray-600">利用規約</Link>
          </p>
        </div>
      </main>
    </div>
  )
}
