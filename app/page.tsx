import Link from 'next/link'
import {
  MessageSquare, Calendar, Users, Newspaper,
  Receipt, ClipboardList, ArrowRight, CheckCircle2,
  Megaphone, Sparkles, Rocket, Wrench, MousePointerClick,
} from 'lucide-react'
import { RoScopeLogo } from '@/app/components/RoScopeLogo'
import { Reveal } from '@/app/components/landing/Reveal'
import { InteractiveDemo } from '@/app/components/landing/InteractiveDemo'

// ── お知らせデータ ──────────────────────────────────────────
type AnnouncementType = 'release' | 'feature' | 'improvement' | 'fix'

const ANNOUNCEMENTS: {
  date: string
  version: string
  type: AnnouncementType
  title: string
  desc: string
}[] = [
  {
    date: '2026年6月3日',
    version: 'v1.4',
    type: 'feature',
    title: '3段階ロール制を導入',
    desc: '管理者・リーダー・メンバーの3段階でアクセス権限を細かく設定できるようになりました。ロールに応じた投稿・編集・削除権限を管理できます。',
  },
  {
    date: '2026年5月20日',
    version: 'v1.3',
    type: 'feature',
    title: 'プッシュ通知に対応',
    desc: '重要マークのついた投稿が作成されたとき、スマホへリアルタイム通知。大切なお知らせを見逃しません。',
  },
  {
    date: '2026年5月10日',
    version: 'v1.2',
    type: 'improvement',
    title: 'リアクション・返信機能を追加',
    desc: '投稿に絵文字リアクションや返信コメントができるようになりました。チームとのコミュニケーションがより活発になります。',
  },
  {
    date: '2026年4月28日',
    version: 'v1.1',
    type: 'improvement',
    title: 'プロフィール・アバター機能',
    desc: 'メンバーのプロフィール写真とプロフィールページを追加。誰の投稿かひと目でわかるようになりました。',
  },
  {
    date: '2026年4月1日',
    version: 'v1.0',
    type: 'release',
    title: 'RoScope 正式リリース',
    desc: '福祉施設チーム向けの業務連絡システム「RoScope」を正式リリースしました。チームの情報共有をもっとスムーズに。',
  },
]

const ANNOUNCEMENT_STYLES: Record<AnnouncementType, { badge: string; dot: string; Icon: React.ElementType }> = {
  release: { badge: 'bg-indigo-100 text-indigo-700', dot: 'bg-indigo-500', Icon: Rocket },
  feature: { badge: 'bg-teal-100 text-teal-700', dot: 'bg-teal-500', Icon: Sparkles },
  improvement: { badge: 'bg-blue-100 text-blue-700', dot: 'bg-blue-500', Icon: Megaphone },
  fix: { badge: 'bg-gray-100 text-gray-600', dot: 'bg-gray-400', Icon: Wrench },
}

// ── ブラウザ風フレーム（ヒーロー用の静的モック） ─────────────
function BrowserFrame({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl overflow-hidden shadow-2xl border border-gray-200 bg-white ${className}`}>
      <div className="flex items-center gap-1.5 px-3 py-2.5 bg-gray-100 border-b border-gray-200">
        <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
        <span className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
        <span className="w-2.5 h-2.5 rounded-full bg-green-400" />
        <div className="ml-2 flex-1 bg-white rounded px-2 py-0.5 text-[10px] text-gray-400 font-mono">
          roscope.vercel.app
        </div>
      </div>
      {children}
    </div>
  )
}

function HomeMockup() {
  const notices = [
    { dept: '総務部', msg: '今月の会議資料をアップしました。ご確認ください。', time: '2時間前', isNew: true },
    { dept: '福祉支援部', msg: '利用者Aさんの面談日程について連絡があります。', time: '5時間前', isNew: true },
    { dept: '相談支援部', msg: '先週の振り返りレポートを提出しました。', time: '1日前', isNew: false },
  ]
  return (
    <BrowserFrame>
      <div className="flex items-center gap-3 px-3 py-2 bg-white border-b border-gray-100">
        <div className="w-5 h-5 bg-blue-600 rounded flex items-center justify-center shrink-0">
          <div className="w-2.5 h-2.5 border border-white rounded-sm" />
        </div>
        <span className="text-[10px] font-semibold text-gray-800">RoScope</span>
        <div className="flex gap-1 ml-1">
          {['ホーム', '全体掲示板', 'スケジュール'].map(t => (
            <span key={t} className="text-[9px] text-gray-500 px-1.5 py-0.5 rounded">{t}</span>
          ))}
        </div>
      </div>
      <div className="p-3 bg-gray-50">
        <div className="text-[10px] font-semibold text-gray-600 mb-1.5">各部署からのお知らせ</div>
        <div className="grid grid-cols-3 gap-1.5 mb-3">
          {notices.map((n) => (
            <div key={n.dept} className="bg-white border border-gray-200 rounded-md overflow-hidden">
              <div className="flex items-center justify-between px-2 py-1 border-b border-gray-100">
                <span className="text-[9px] font-medium text-gray-700">{n.dept}</span>
                {n.isNew && <span className="text-[7px] font-bold text-blue-600 bg-blue-50 px-1 rounded">NEW</span>}
              </div>
              <div className="px-2 py-1.5">
                <p className="text-[8px] text-gray-600 leading-tight line-clamp-2">{n.msg}</p>
                <p className="text-[7px] text-gray-400 mt-1">{n.time}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="text-[10px] font-semibold text-gray-600 mb-1.5">チームのメッセージ</div>
        <div className="grid grid-cols-2 gap-1.5">
          {[
            { name: '田中 花子', msg: '午後の研修、よろしくお願いします！', isMe: true },
            { name: '山田 太郎', msg: '今日の利用者面談の件、確認しました。', isMe: false },
          ].map((m) => (
            <div key={m.name} className={`rounded-md overflow-hidden border ${m.isMe ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200'}`}>
              <div className={`flex items-center gap-1.5 px-2 py-1 border-b ${m.isMe ? 'border-blue-100' : 'border-gray-100'}`}>
                <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[7px] font-bold ${m.isMe ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
                  {m.name[0]}
                </div>
                <span className="text-[9px] font-medium text-gray-700">{m.name}</span>
                {m.isMe && <span className="text-[7px] text-blue-500">（自分）</span>}
              </div>
              <div className="px-2 py-1.5">
                <p className="text-[8px] text-gray-600 leading-tight">{m.msg}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </BrowserFrame>
  )
}

// ── フィーチャーカード ──────────────────────────────────────
const FEATURES = [
  {
    Icon: MessageSquare,
    color: 'bg-blue-50 text-blue-600',
    title: '全体掲示板',
    desc: '全部署から組織全体へのお知らせをリアルタイムで共有。重要連絡はホームに自動表示。',
  },
  {
    Icon: Calendar,
    color: 'bg-indigo-50 text-indigo-600',
    title: 'スケジュール管理',
    desc: '全体・部署ごとのカレンダーでイベントを一元管理。',
  },
  {
    Icon: ClipboardList,
    color: 'bg-violet-50 text-violet-600',
    title: '日程調整',
    desc: '候補日を出してメンバーが○△×で回答。最適な日程をスムーズに決定。',
  },
  {
    Icon: Newspaper,
    color: 'bg-teal-50 text-teal-600',
    title: '福祉最新情報',
    desc: '厚生労働省・WAM NETの最新情報を自動収集。いつでも最新の福祉ニュースを確認。',
  },
  {
    Icon: Users,
    color: 'bg-green-50 text-green-600',
    title: 'メンバー管理',
    desc: '組織のメンバーをひと目で確認。プロフィールや投稿履歴も閲覧できる。',
  },
  {
    Icon: Receipt,
    color: 'bg-orange-50 text-orange-600',
    title: '活動費請求',
    desc: '請求フォームへ直接アクセス。外部ツールを開かずにそのまま申請できる。',
  },
]

// ── ランディングページ本体 ──────────────────────────────────
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-gray-900">

      {/* ナビバー */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-5 h-14 flex items-center justify-between">
          <RoScopeLogo size="sm" />
          <Link
            href="/login"
            className="inline-flex items-center min-h-[44px] text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-md transition-colors"
          >
            ログイン
          </Link>
        </div>
      </header>

      {/* ヒーロー */}
      <section className="relative overflow-hidden" style={{ background: 'linear-gradient(160deg,#172554 0%,#1e3a8a 40%,#1d4ed8 75%,#3b82f6 100%)' }}>
        {/* 動くブロブ + ドットパターン */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-blue-500/30 rounded-full blur-3xl anim-blob pointer-events-none" aria-hidden />
        <div className="absolute -bottom-32 right-0 w-[28rem] h-[28rem] bg-indigo-400/25 rounded-full blur-3xl anim-blob pointer-events-none" style={{ animationDelay: '-8s' }} aria-hidden />
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 70% 50%, white 1px, transparent 1px)', backgroundSize: '32px 32px' }} aria-hidden />

        <div className="relative max-w-6xl mx-auto px-5 py-16 lg:py-28 flex flex-col lg:flex-row items-center gap-12">
          {/* テキスト */}
          <div className="flex-1 text-center lg:text-left">
            <Reveal>
              <span className="inline-flex items-center gap-1.5 bg-white/10 border border-white/20 text-blue-100 text-xs font-medium px-3 py-1 rounded-full mb-5 backdrop-blur">
                <Sparkles className="w-3.5 h-3.5 text-blue-200" />
                福祉施設チーム向け 業務連絡システム
              </span>
            </Reveal>
            <Reveal delay={100}>
              <h1 className="text-3xl sm:text-4xl lg:text-[3.25rem] font-bold text-white leading-[1.15] tracking-tight mb-5">
                チームの情報共有を<br />
                <span className="text-shine bg-gradient-to-r from-white via-blue-200 to-white bg-clip-text text-transparent">
                  もっとスムーズに
                </span>
              </h1>
            </Reveal>
            <Reveal delay={200}>
              <p className="text-blue-100/90 text-base sm:text-lg leading-relaxed mb-8 max-w-lg mx-auto lg:mx-0">
                部署間の情報共有・スケジュール管理・日程調整・福祉最新情報の収集まで、日常業務に必要な機能をひとつにまとめました。
              </p>
            </Reveal>
            <Reveal delay={300}>
              <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
                <Link
                  href="/login"
                  className="group inline-flex items-center justify-center gap-2 bg-white text-blue-700 font-semibold px-6 py-3 rounded-lg hover:bg-blue-50 transition-all shadow-lg shadow-blue-950/20 hover:shadow-xl hover:-translate-y-0.5"
                >
                  ログインして始める
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </Link>
                <a
                  href="#demo"
                  className="inline-flex items-center justify-center gap-2 bg-white/10 border border-white/25 text-white font-semibold px-6 py-3 rounded-lg hover:bg-white/20 transition-colors backdrop-blur"
                >
                  <MousePointerClick className="w-4 h-4" />
                  触って体験する
                </a>
              </div>
            </Reveal>
            <Reveal delay={400}>
              <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 justify-center lg:justify-start">
                {['リアルタイム更新', 'ファイル添付対応', 'マルチ部署対応', 'スマホ対応'].map(t => (
                  <span key={t} className="flex items-center gap-1.5 text-blue-200 text-sm">
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-300" />{t}
                  </span>
                ))}
              </div>
            </Reveal>
          </div>
          {/* モックアップ（ふわふわ浮く） */}
          <div className="flex-1 w-full max-w-lg relative">
            <div className="absolute -inset-6 bg-blue-400/25 blur-3xl rounded-full pointer-events-none" aria-hidden />
            <Reveal delay={250}>
              <div className="relative anim-float">
                <HomeMockup />
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* 機能紹介 */}
      <section className="py-16 lg:py-24 bg-gray-50">
        <div className="max-w-6xl mx-auto px-5">
          <Reveal>
            <div className="text-center mb-12">
              <p className="text-blue-600 text-sm font-semibold mb-2">FEATURES</p>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">すべての機能がひとつに</h2>
            </div>
          </Reveal>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map(({ Icon, color, title, desc }, i) => (
              <Reveal key={title} delay={(i % 3) * 100}>
                <div className="group h-full bg-white rounded-2xl border border-gray-200 p-6 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-900/5 hover:-translate-y-1 transition-all duration-200">
                  <div className={`w-11 h-11 ${color} rounded-xl flex items-center justify-center mb-4 ring-1 ring-inset ring-black/5 group-hover:scale-110 transition-transform`}>
                    <Icon className="w-5 h-5" strokeWidth={1.75} />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1.5">{title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* インタラクティブデモ */}
      <section id="demo" className="py-16 lg:py-24 bg-white scroll-mt-14 overflow-hidden">
        <div className="max-w-6xl mx-auto px-5">
          <Reveal>
            <div className="text-center mb-12">
              <p className="text-blue-600 text-sm font-semibold mb-2 flex items-center justify-center gap-1.5">
                <MousePointerClick className="w-4 h-4" />
                INTERACTIVE DEMO
              </p>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">実際に触って体験できます</h2>
              <p className="text-gray-500 max-w-xl mx-auto">
                下の画面は本物そっくりに動くデモです。タップ・クリックして、RoScope の操作感をそのまま確かめてください。
              </p>
            </div>
          </Reveal>
          <Reveal delay={150}>
            <InteractiveDemo />
          </Reveal>
        </div>
      </section>

      {/* こんな場面で活躍します */}
      <section className="py-16 lg:py-24 bg-gray-50">
        <div className="max-w-6xl mx-auto px-5">
          <Reveal>
            <div className="text-center mb-12">
              <p className="text-teal-600 text-sm font-semibold mb-2">USE CASES</p>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">こんな場面で活躍します</h2>
            </div>
          </Reveal>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                img: 'https://images.pexels.com/photos/6248989/pexels-photo-6248989.jpeg?auto=compress&cs=tinysrgb&w=600&h=360&fit=crop',
                alt: '朝礼・情報共有の様子',
                label: '毎日の朝礼・業務連絡',
                desc: '各部署のお知らせをホーム画面でまとめて確認。大切な情報をチーム全員が同じタイミングで受け取れます。',
              },
              {
                img: 'https://images.pexels.com/photos/6170652/pexels-photo-6170652.jpeg?auto=compress&cs=tinysrgb&w=600&h=360&fit=crop',
                alt: 'スケジュール管理の様子',
                label: '会議・研修の日程調整',
                desc: '候補日をメンバーに共有して○△×で回答収集。カレンダーへの自動登録で手間をゼロに。',
              },
              {
                img: 'https://images.pexels.com/photos/34975095/pexels-photo-34975095.jpeg?auto=compress&cs=tinysrgb&w=600&h=360&fit=crop',
                alt: '重要連絡を確認する様子',
                label: '重要連絡の確実な周知',
                desc: '重要マーク付きの投稿は未読バナーとプッシュ通知でお知らせ。見逃しを防いで連絡の抜け漏れをなくします。',
              },
            ].map(({ img, alt, label, desc }, i) => (
              <Reveal key={label} delay={i * 120}>
                <div className="h-full rounded-2xl overflow-hidden border border-gray-200 bg-white hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
                  <div className="relative overflow-hidden h-48">
                    <img
                      src={img}
                      alt={alt}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent" aria-hidden />
                    <h3 className="absolute bottom-3 left-4 right-4 text-white font-semibold text-base drop-shadow-sm">{label}</h3>
                  </div>
                  <div className="p-5">
                    <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* お知らせ */}
      <section className="py-16 lg:py-24 bg-white">
        <div className="max-w-3xl mx-auto px-5">
          <Reveal>
            <div className="text-center mb-10">
              <p className="text-blue-600 text-sm font-semibold mb-2">CHANGELOG</p>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">お知らせ・更新履歴</h2>
            </div>
          </Reveal>

          <div className="relative">
            <div className="absolute left-5 top-3 bottom-3 w-px bg-gray-200 hidden sm:block" />
            <div className="space-y-6">
              {ANNOUNCEMENTS.map((item, i) => {
                const { badge, dot, Icon } = ANNOUNCEMENT_STYLES[item.type]
                return (
                  <Reveal key={`${item.date}-${item.version}`} delay={Math.min(i * 80, 240)}>
                    <div className="flex gap-5 sm:gap-8 items-start group">
                      <div className="relative z-10 hidden sm:flex shrink-0 items-center justify-center w-10 h-10 rounded-full bg-white border-2 border-gray-200 group-hover:border-gray-300 transition-colors shadow-sm">
                        <div className={`w-3 h-3 rounded-full ${dot}`} />
                      </div>
                      <div className="flex-1 bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
                        <div className="flex items-center flex-wrap gap-2 mb-2">
                          <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${badge}`}>
                            <Icon className="w-3 h-3" />
                            {item.version}
                          </span>
                          <span className="text-xs text-gray-400">{item.date}</span>
                        </div>
                        <h3 className="font-semibold text-gray-900 mb-1">{item.title}</h3>
                        <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
                      </div>
                    </div>
                  </Reveal>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden py-16 lg:py-24" style={{ background: 'linear-gradient(135deg,#172554,#1d4ed8)' }}>
        <div className="absolute -top-20 left-1/4 w-80 h-80 bg-blue-500/25 rounded-full blur-3xl anim-blob pointer-events-none" aria-hidden />
        <div className="absolute inset-0 opacity-10" aria-hidden
          style={{ backgroundImage: 'radial-gradient(circle at 50% 40%, white 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
        <div className="relative max-w-2xl mx-auto px-5 text-center">
          <Reveal>
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
              さっそく使ってみましょう
            </h2>
            <p className="text-blue-200 mb-8">団体ID・ユーザーID・パスワードを入力するだけですぐに始められます</p>
            <Link
              href="/login"
              className="group inline-flex items-center gap-2 bg-white text-blue-700 font-semibold px-8 py-3.5 rounded-lg hover:bg-blue-50 transition-all shadow-xl shadow-blue-950/30 hover:-translate-y-0.5 text-base"
            >
              ログインページへ
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </Reveal>
        </div>
      </section>

      {/* フッター */}
      <footer className="bg-gray-900 text-gray-400 py-8">
        <div className="max-w-6xl mx-auto px-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <RoScopeLogo size="sm" variant="light" />
          <p className="text-xs">&copy; 2026 All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
