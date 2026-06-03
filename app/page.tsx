import Link from 'next/link'
import {
  MessageSquare, Calendar, Users, Newspaper,
  Receipt, ClipboardList, ArrowRight, CheckCircle2,
  Megaphone, Sparkles, Rocket, Wrench,
} from 'lucide-react'
import { RoScopeLogo } from '@/app/components/RoScopeLogo'

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

// ── ブラウザ風フレーム ──────────────────────────────────────
function BrowserFrame({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl overflow-hidden shadow-2xl border border-gray-200 bg-white ${className}`}>
      <div className="flex items-center gap-1.5 px-3 py-2.5 bg-gray-100 border-b border-gray-200">
        <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
        <span className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
        <span className="w-2.5 h-2.5 rounded-full bg-green-400" />
        <div className="ml-2 flex-1 bg-white rounded px-2 py-0.5 text-[10px] text-gray-400 font-mono">
          gyomu-renraku.vercel.app
        </div>
      </div>
      {children}
    </div>
  )
}

// ── ホーム画面モックアップ ──────────────────────────────────
function HomeMockup() {
  const notices = [
    { dept: '総務部', msg: '今月の会議資料をアップしました。ご確認ください。', time: '2時間前', isNew: true },
    { dept: '福祉支援部', msg: '利用者Aさんの面談日程について連絡があります。', time: '5時間前', isNew: true },
    { dept: '相談支援部', msg: '先週の振り返りレポートを提出しました。', time: '1日前', isNew: false },
  ]
  return (
    <BrowserFrame>
      {/* ナビバー */}
      <div className="flex items-center gap-3 px-3 py-2 bg-white border-b border-gray-100">
        <div className="w-5 h-5 bg-blue-600 rounded flex items-center justify-center shrink-0">
          <div className="w-2.5 h-2.5 border border-white rounded-sm" />
        </div>
        <span className="text-[10px] font-semibold text-gray-800">RoScope</span>
        <div className="flex gap-1 ml-1">
          {['ホーム','連絡ボード','スケジュール'].map(t => (
            <span key={t} className="text-[9px] text-gray-500 px-1.5 py-0.5 rounded hover:bg-gray-100">{t}</span>
          ))}
        </div>
      </div>
      {/* コンテンツ */}
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

// ── カレンダーモックアップ ──────────────────────────────────
function CalendarMockup() {
  const days = ['日','月','火','水','木','金','土']
  const cells = [null,null,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,null,null]
  const events: Record<number,string[]> = {
    5: ['利用者A面談'],
    12: ['全体会議'],
    18: ['研修'],
    25: ['月次報告'],
  }
  return (
    <BrowserFrame>
      <div className="p-3 bg-gray-50">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1">
            <div className="w-5 h-5 flex items-center justify-center rounded hover:bg-gray-200 cursor-pointer text-gray-500 text-xs">‹</div>
            <span className="text-[11px] font-semibold text-gray-800 w-20 text-center">2026年6月</span>
            <div className="w-5 h-5 flex items-center justify-center rounded hover:bg-gray-200 cursor-pointer text-gray-500 text-xs">›</div>
          </div>
          <div className="text-[9px] bg-blue-600 text-white px-2 py-0.5 rounded font-medium">+ 追加</div>
        </div>
        <div className="bg-white rounded-lg overflow-hidden border border-gray-200">
          <div className="grid grid-cols-7 border-b border-gray-100">
            {days.map((d, i) => (
              <div key={d} className={`text-center text-[9px] font-medium py-1 ${i===0?'text-red-400':i===6?'text-blue-400':'text-gray-500'}`}>{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {cells.map((day, i) => (
              <div key={i} className={`min-h-[28px] border-r border-b border-gray-100 p-0.5 ${i%7===6?'border-r-0':''} ${day?'':'bg-gray-50/40'}`}>
                {day && (
                  <>
                    <span className={`text-[8px] font-medium inline-flex w-3.5 h-3.5 items-center justify-center rounded-full ${
                      day===2?'bg-blue-600 text-white':i%7===0?'text-red-400':i%7===6?'text-blue-400':'text-gray-600'
                    }`}>{day}</span>
                    {events[day] && (
                      <div className="text-[6px] px-0.5 py-0.5 mt-0.5 rounded bg-blue-100 text-blue-700 truncate leading-tight">
                        {events[day][0]}
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </BrowserFrame>
  )
}

// ── 日程調整モックアップ ────────────────────────────────────
function ScheduleMockup() {
  const dates = ['6/10(水)', '6/11(木)', '6/12(金)']
  const rows = [
    { name: '田中 花子', answers: ['ok','ok','ng'], isMe: true },
    { name: '山田 太郎', answers: ['ok','maybe','ok'], isMe: false },
    { name: '相談支援部', answers: ['ng','ok','ok'], isMe: false },
  ]
  const DISP: Record<string,{label:string;cls:string}> = {
    ok:    { label: '○', cls: 'bg-green-50 text-green-600 border-green-200' },
    maybe: { label: '△', cls: 'bg-yellow-50 text-amber-500 border-yellow-200' },
    ng:    { label: '×', cls: 'bg-red-50 text-red-500 border-red-200' },
  }
  return (
    <BrowserFrame>
      <div className="p-3 bg-gray-50">
        <p className="text-[10px] font-semibold text-gray-700 mb-2">6月研修日程調整</p>
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full border-collapse text-[9px]">
            <thead>
              <tr>
                <th className="bg-gray-50 border-b border-r border-gray-200 px-2 py-1.5 text-left text-gray-500 font-semibold">名前</th>
                {dates.map(d => (
                  <th key={d} className="border-b border-r last:border-r-0 border-gray-200 px-2 py-1.5 text-center text-gray-700 font-semibold whitespace-nowrap">{d}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, ri) => (
                <tr key={row.name} className={ri%2===0?'bg-white':'bg-gray-50/50'}>
                  <td className="border-b border-r border-gray-100 px-2 py-1.5">
                    <div className="flex items-center gap-1">
                      <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[7px] font-bold shrink-0 ${row.isMe?'bg-blue-600 text-white':'bg-gray-100 text-gray-600'}`}>
                        {row.name[0]}
                      </div>
                      <span className={`whitespace-nowrap ${row.isMe?'text-blue-700':'text-gray-700'}`}>{row.name}</span>
                    </div>
                  </td>
                  {row.answers.map((a, ai) => (
                    <td key={ai} className="border-b border-r last:border-r-0 border-gray-100 px-1 py-1 text-center">
                      <span className={`inline-flex items-center justify-center w-6 h-5 rounded border text-[9px] font-bold ${DISP[a].cls}`}>
                        {DISP[a].label}
                      </span>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-[8px] text-gray-400 mt-1.5 text-center">自分の行をクリックして回答 · ○→△→×の順で切り替わります</p>
      </div>
    </BrowserFrame>
  )
}

// ── フィーチャーカード ──────────────────────────────────────
const FEATURES = [
  {
    Icon: MessageSquare,
    color: 'bg-blue-50 text-blue-600',
    title: '連絡ボード',
    desc: '部署ごとのお知らせをリアルタイムで共有。画像・動画・PDFの添付にも対応。',
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
            className="text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-md transition-colors"
          >
            ログイン
          </Link>
        </div>
      </header>

      {/* ヒーロー */}
      <section className="relative overflow-hidden" style={{ background: 'linear-gradient(160deg,#1e3a8a 0%,#1d4ed8 55%,#3b82f6 100%)' }}>
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 70% 50%, white 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
        <div className="relative max-w-6xl mx-auto px-5 py-16 lg:py-24 flex flex-col lg:flex-row items-center gap-12">
          {/* テキスト */}
          <div className="flex-1 text-center lg:text-left">
            <p className="text-blue-300 text-sm font-medium mb-3 tracking-wide">チームの今を、一目で見渡す。</p>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight mb-5">
              チームの情報共有を<br />もっとスムーズに
            </h1>
            <p className="text-blue-100 text-base leading-relaxed mb-8 max-w-lg mx-auto lg:mx-0">
              部署間の情報共有・スケジュール管理・日程調整・福祉最新情報の収集まで、日常業務に必要な機能をひとつにまとめました。
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 bg-white text-blue-700 font-semibold px-6 py-3 rounded-lg hover:bg-blue-50 transition-colors shadow-md"
              >
                ログインして始める <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 justify-center lg:justify-start">
              {['リアルタイム更新', 'ファイル添付対応', 'マルチ部署対応', 'スマホ対応'].map(t => (
                <span key={t} className="flex items-center gap-1.5 text-blue-200 text-sm">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-300" />{t}
                </span>
              ))}
            </div>
          </div>
          {/* モックアップ */}
          <div className="flex-1 w-full max-w-lg">
            <HomeMockup />
          </div>
        </div>
      </section>

      {/* 機能紹介 */}
      <section className="py-16 lg:py-24 bg-gray-50">
        <div className="max-w-6xl mx-auto px-5">
          <div className="text-center mb-12">
            <p className="text-blue-600 text-sm font-semibold mb-2">FEATURES</p>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">すべての機能がひとつに</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map(({ Icon, color, title, desc }) => (
              <div key={title} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
                <div className={`w-10 h-10 ${color} rounded-lg flex items-center justify-center mb-3`}>
                  <Icon className="w-5 h-5" strokeWidth={1.75} />
                </div>
                <h3 className="font-semibold text-gray-900 mb-1.5">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* スクリーンショット：カレンダー */}
      <section className="py-16 lg:py-24 bg-white">
        <div className="max-w-6xl mx-auto px-5">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            <div className="flex-1 order-2 lg:order-1 w-full max-w-lg mx-auto">
              <CalendarMockup />
            </div>
            <div className="flex-1 order-1 lg:order-2 text-center lg:text-left">
              <p className="text-blue-600 text-sm font-semibold mb-2">SCHEDULE</p>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
                スケジュールを<br />チームで共有
              </h2>
              <p className="text-gray-500 leading-relaxed mb-5">
                月カレンダー形式で全体・部署ごとのイベントを管理できます。日付をクリックするだけでイベントを追加でき、チーム全員がリアルタイムで確認できます。
              </p>
              <ul className="space-y-2 text-sm text-gray-600 text-left inline-block">
                {['全体・部署別の2種類のカレンダー', 'イベントの場所・メモを記録', 'ユニゾンプラザの空き状況も確認できる'].map(t => (
                  <li key={t} className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0" />{t}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* スクリーンショット：日程調整 */}
      <section className="py-16 lg:py-24 bg-gray-50">
        <div className="max-w-6xl mx-auto px-5">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            <div className="flex-1 text-center lg:text-left">
              <p className="text-violet-600 text-sm font-semibold mb-2">SCHEDULE POLL</p>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
                日程調整を<br />かんたんに
              </h2>
              <p className="text-gray-500 leading-relaxed mb-5">
                候補日を複数出して、メンバー全員が○△×で回答。集計結果が一目でわかるので、会議や研修の日程決めがスムーズになります。
              </p>
              <ul className="space-y-2 text-sm text-gray-600 text-left inline-block">
                {['候補日を期間で一括追加できる', 'クリックひとつで回答を切り替え', '回答確定後はカレンダーに自動登録'].map(t => (
                  <li key={t} className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-violet-500 shrink-0" />{t}
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex-1 w-full max-w-lg mx-auto">
              <ScheduleMockup />
            </div>
          </div>
        </div>
      </section>

      {/* こんな場面で活躍します */}
      <section className="py-16 lg:py-24 bg-white">
        <div className="max-w-6xl mx-auto px-5">
          <div className="text-center mb-12">
            <p className="text-teal-600 text-sm font-semibold mb-2">USE CASES</p>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">こんな場面で活躍します</h2>
          </div>
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
            ].map(({ img, alt, label, desc }) => (
              <div key={label} className="rounded-2xl overflow-hidden border border-gray-200 hover:shadow-lg transition-shadow group">
                <div className="overflow-hidden h-48">
                  <img
                    src={img}
                    alt={alt}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                </div>
                <div className="p-5">
                  <h3 className="font-semibold text-gray-900 mb-2">{label}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* お知らせ */}
      <section className="py-16 lg:py-24 bg-gray-50">
        <div className="max-w-3xl mx-auto px-5">
          <div className="text-center mb-10">
            <p className="text-blue-600 text-sm font-semibold mb-2">CHANGELOG</p>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">お知らせ・更新履歴</h2>
          </div>

          <div className="relative">
            {/* 縦ライン */}
            <div className="absolute left-5 top-3 bottom-3 w-px bg-gray-200 hidden sm:block" />

            <div className="space-y-6">
              {ANNOUNCEMENTS.map((item) => {
                const { badge, dot, Icon } = ANNOUNCEMENT_STYLES[item.type]
                return (
                  <div key={`${item.date}-${item.version}`} className="flex gap-5 sm:gap-8 items-start group">
                    {/* ドット */}
                    <div className="relative z-10 hidden sm:flex shrink-0 items-center justify-center w-10 h-10 rounded-full bg-white border-2 border-gray-200 group-hover:border-gray-300 transition-colors shadow-sm">
                      <div className={`w-3 h-3 rounded-full ${dot}`} />
                    </div>
                    {/* カード */}
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
                )
              })}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 lg:py-20" style={{ background: 'linear-gradient(135deg,#1e3a8a,#2563eb)' }}>
        <div className="max-w-2xl mx-auto px-5 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
            さっそく使ってみましょう
          </h2>
          <p className="text-blue-200 mb-8">団体ID・ユーザーID・パスワードを入力するだけですぐに始められます</p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 bg-white text-blue-700 font-semibold px-8 py-3.5 rounded-lg hover:bg-blue-50 transition-colors shadow-lg text-base"
          >
            ログインページへ <ArrowRight className="w-4 h-4" />
          </Link>
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
