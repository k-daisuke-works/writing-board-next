import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { RoScopeLogo } from '@/app/components/RoScopeLogo'

export const metadata = { title: '利用規約 | RoScope' }

const NAVY = '#001e5a'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="font-maru font-extrabold text-lg mb-3" style={{ color: NAVY }}>{title}</h2>
      <div className="text-sm text-gray-600 leading-relaxed space-y-2">{children}</div>
    </section>
  )
}

export default function TermsPage() {
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
          <h1 className="font-maru font-extrabold text-2xl mb-2" style={{ color: NAVY }}>利用規約</h1>
          <p className="text-xs text-gray-400 mb-8">制定日: 2026年7月10日（最終改定: 2026年7月11日）</p>

          <Section title="1. 適用">
            <p>
              本規約は、チーム情報共有ボード「RoScope」（以下「本システム」）の利用条件を定めるものです。
              利用者は、本システムにログインすることで本規約および
              <Link href="/privacy" className="underline hover:text-gray-800">プライバシーポリシー</Link>
              に同意したものとみなされます。
            </p>
          </Section>

          <Section title="2. アカウントの管理">
            <ul className="list-disc list-inside space-y-1">
              <li>ユーザーID・パスワードは利用者本人が責任をもって管理し、第三者に共有しないでください</li>
              <li>アカウントの不正利用に気づいた場合は、速やかに所属団体の管理者に連絡してください</li>
            </ul>
          </Section>

          <Section title="3. 禁止事項">
            <ul className="list-disc list-inside space-y-1">
              <li>他者の名誉を毀損し、または誹謗中傷する投稿</li>
              <li>他者の著作権・肖像権その他の権利を侵害するファイルの投稿・添付</li>
              <li>
                <span className="font-bold text-gray-800">業務上知り得た相談援助対象者等の秘密をみだりに投稿する行為</span>
                （社会福祉士及び介護福祉士法第46条の守秘義務に留意し、支援に関する情報共有は必要最小限・特定されない形で行ってください）
              </li>
              <li>法令または公序良俗に違反する行為</li>
              <li>本システムへの不正アクセス、他者のアカウントの利用</li>
            </ul>
          </Section>

          <Section title="4. 投稿の取扱い">
            <p>
              投稿・添付ファイルの内容に関する責任は投稿者に帰属します。
              利用団体の管理者は、本規約に違反する投稿や運営上支障のある投稿を、投稿者への事前通知なく削除できます。
              権利侵害の申告があった場合、管理者は投稿の削除等の必要な対応を行います。
            </p>
          </Section>

          <Section title="4の2. ダイレクトメッセージの取扱い">
            <p>
              メンバー間の1対1メッセージ（DM）は、双方が承諾した相手とのみやり取りできます。
              DMの内容は当事者以外が閲覧できない仕組みとしており、運営者および利用団体の管理者もこれを閲覧しません。
            </p>
            <p>
              ただし、当事者の一方が「管理者に報告」の操作を行った場合に限り、当該スレッドの内容が
              利用団体の管理者に開示されます（開示の操作および管理者の閲覧はいずれも記録されます）。
              ハラスメント等のトラブルの際はこの報告機能を利用してください。
              DMにも第3条の禁止事項が適用されます。
            </p>
          </Section>

          <Section title="5. サービスの提供・免責">
            <ul className="list-disc list-inside space-y-1">
              <li>保守・障害対応等のため、予告なく本システムの提供を一時停止することがあります</li>
              <li>運営者は、本システムの利用により生じた損害について、故意または重過失による場合を除き責任を負いません</li>
              <li>重要なデータは各団体でも適宜控えを保管してください</li>
            </ul>
          </Section>

          <Section title="6. 規約の変更">
            <p>
              本規約を変更する場合は、本ページでお知らせします。重要な変更がある場合は、システム内の掲示板でも周知します。
            </p>
          </Section>

          <Section title="7. 準拠法">
            <p>本規約は日本法に準拠し、解釈されます。</p>
          </Section>

          <p className="text-xs text-gray-400 mt-10">
            関連: <Link href="/privacy" className="underline hover:text-gray-600">プライバシーポリシー</Link>
          </p>
        </div>
      </main>
    </div>
  )
}
