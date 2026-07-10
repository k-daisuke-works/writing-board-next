import Link from 'next/link'
import { ArrowRight, MousePointerClick } from 'lucide-react'
import { RoScopeLogo } from '@/app/components/RoScopeLogo'
import { Reveal } from '@/app/components/landing/Reveal'
import { InteractiveDemo } from '@/app/components/landing/InteractiveDemo'

const YELLOW = '#ffc300'
const NAVY = '#001e5a'
const TEAL = '#23aabe'
const GREEN = '#7dbb01'

// ── 波区切り ──────────────────────────────────────────────
function Wave({ fill }: { fill: string }) {
  return (
    <div className="wave-clip -mb-px" aria-hidden>
      <svg viewBox="0 0 2400 60" preserveAspectRatio="none">
        <path
          d="M0,30 C150,55 300,5 450,30 C600,55 750,5 900,30 C1050,55 1200,5 1350,30 C1500,55 1650,5 1800,30 C1950,55 2100,5 2250,30 L2400,30 L2400,60 L0,60 Z"
          fill={fill}
        />
      </svg>
    </div>
  )
}

// ── ヒーロー用スマホモック（実UI） ──────────────────────────
function PhoneMock() {
  return (
    <div className="w-[min(250px,62vw)] mx-auto rotate-3 rounded-[30px] border-8 border-gray-900 overflow-hidden bg-gray-50 shadow-2xl shadow-blue-950/40">
      <div className="bg-white flex items-center gap-1.5 px-3 py-2 border-b border-gray-100 text-[10px] font-bold text-gray-800">
        <span className="w-[15px] h-[15px] bg-blue-600 rounded shrink-0" />
        RoScope — 掲示板
      </div>
      <div className="p-2.5 space-y-2">
        {[
          {
            initial: '田', name: '田中 花子', meta: '研修班 · 10分前', mine: true,
            msg: '6月の定例研修、会場はユニゾンプラザ大会議室に決定しました！',
            reacts: [{ e: '👍 3', on: true }, { e: '🎉 2', on: false }], reads: '既読 8人',
          },
          {
            initial: '山', name: '山田 太郎', meta: '事務局 · 2時間前', mine: false,
            msg: '理事会の報告資料を共有します。各班でご確認ください📎',
            reacts: [{ e: '👍 5', on: false }], reads: '既読 12人',
          },
        ].map(post => (
          <div key={post.name} className="bg-white border border-gray-100 rounded-xl p-2.5">
            <div className="flex items-center gap-1.5 mb-1">
              <span className={`w-[18px] h-[18px] rounded-full text-[8px] font-extrabold flex items-center justify-center shrink-0 ${
                post.mine ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
              }`}>{post.initial}</span>
              <div>
                <div className="text-[9px] font-bold text-gray-800 leading-tight">{post.name}</div>
                <div className="text-[7px] text-gray-400 leading-tight">{post.meta}</div>
              </div>
            </div>
            <p className="text-[9px] text-gray-600 leading-relaxed mb-1.5">{post.msg}</p>
            <div className="flex items-center gap-1">
              {post.reacts.map(r => (
                <span key={r.e} className={`text-[8.5px] rounded-full border px-2 py-0.5 ${
                  r.on ? 'bg-blue-50 border-blue-300 text-blue-700 font-bold' : 'bg-gray-50 border-gray-200 text-gray-600'
                }`}>{r.e}</span>
              ))}
              <span className="text-[7.5px] text-gray-400 ml-auto">{post.reads}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── ゆらゆらする顔 ──────────────────────────────────────────
function Face({ color, delay }: { color: string; delay?: string }) {
  return (
    <div
      className="anim-yura w-[58px] h-[58px] rounded-full mx-auto relative"
      style={{ background: color, animationDelay: delay }}
      aria-hidden
    >
      <span className="absolute left-[16px] top-[22px] w-1.5 h-1.5 rounded-full bg-gray-800" />
      <span className="absolute left-[36px] top-[22px] w-1.5 h-1.5 rounded-full bg-gray-800" />
      <span className="absolute left-[24px] top-[36px] w-2.5 h-[5px] rounded-b-full bg-gray-800" />
    </div>
  )
}

// ── データ ──────────────────────────────────────────────────
const WORRIES = [
  { bubble: <>連絡がメールとLINEに<br />散らばって追えない…</>, color: YELLOW, who: '班長', delay: '0s' },
  { bubble: <>調整さんのURL、<br />どれが最新だっけ？</>, color: '#92ddd6', who: '研修班', delay: '-1.5s' },
  { bubble: <>ほかの班が何してるか、<br />ぜんぜん見えない…</>, color: '#ddd282', who: '会員', delay: '-3s' },
]

const BOARDS = [
  { mark: '全', color: YELLOW, shadow: '#d9a600', text: NAVY, title: '全体掲示板', desc: '班から会全体へ。研修の案内も理事会報告も、全員に確実に届く。' },
  { mark: '班', color: TEAL, shadow: '#17798a', text: '#fff', title: 'チーム共有板', desc: '班のなかの相談・進捗はここ。ほかの班のタイムラインを邪魔しない。' },
  { mark: '報', color: GREEN, shadow: '#5e8d00', text: '#fff', title: 'お知らせ', desc: '班のリーダーからメンバー全員へ。大事な連絡はホームに自動表示。' },
]

const FEATURES = [
  { emoji: '🗓️', bg: '#fff4d1', title: '日程調整', desc: <>候補日に○△×で回答するだけ。<b>もう調整さんのリンクを探さない。</b>確定したらカレンダーへ自動登録。</> },
  { emoji: '🏢', bg: '#e5f6f4', title: 'ユニゾンプラザ空き状況', desc: <>研修会場の空きをアプリの中でそのまま確認。会場探しと日程決めがひと続きに。</> },
  { emoji: '🧾', bg: '#f0f7e0', title: '活動費請求', desc: <>毎回の請求はフォームへ直行。会員番号は自動入力、スマホから送信完了。</> },
  { emoji: '📅', bg: '#e5f6f4', title: 'スケジュール', desc: <>会全体・班ごとのカレンダーで研修や会議を一元管理。</> },
  { emoji: '👥', bg: '#f0f7e0', title: 'メンバー', desc: <>会員のプロフィールや所属班、投稿履歴もひと目で。</> },
  { emoji: '📰', bg: '#fff4d1', title: '福祉ニュース', desc: <>厚労省・WAM NETの最新情報を自動収集。情報のアンテナも会でひとつに。</> },
]

const STEPS = [
  { num: '1', title: 'ログイン', desc: '団体ID・ユーザーID・パスワードを入れるだけ。アプリのインストールも不要（ホーム画面に追加OK）。' },
  { num: '2', title: 'ホームを見る', desc: '重要連絡と班のお知らせが最初の画面に。まずは今日の分をチェック。' },
  { num: '3', title: '投稿してみる', desc: '30秒でひとこと投稿。班のみんなからリアクションが返ってくるとうれしい。' },
]

// ── ランディングページ本体 ──────────────────────────────────
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-gray-800">

      {/* ナビバー */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur">
        <div className="max-w-5xl mx-auto px-5 h-[68px] flex items-center justify-between">
          <RoScopeLogo size="sm" />
          <Link
            href="/login"
            className="font-maru inline-flex items-center justify-center min-h-[44px] text-[15px] font-bold text-white px-7 rounded-full transition-transform hover:-translate-y-0.5 hover:scale-[1.03] active:scale-95"
            style={{ background: NAVY, boxShadow: '0 5px 0 #001240' }}
          >
            ログイン
          </Link>
        </div>
      </header>

      {/* ヒーロー */}
      <div className="relative overflow-hidden pt-16 pb-6" style={{ background: YELLOW }}>
        <span className="anim-puka absolute w-[90px] h-[90px] rounded-full bg-white/35 top-[10%] right-[12%]" aria-hidden />
        <span className="anim-puka absolute w-[46px] h-[46px] rounded-full opacity-80 bottom-[22%] right-[4%]" style={{ background: TEAL, animationDelay: '-1.4s' }} aria-hidden />
        <span className="anim-puka absolute w-[30px] h-[30px] rounded-full opacity-85 top-[26%] -left-1.5" style={{ background: GREEN, animationDelay: '-2.2s' }} aria-hidden />
        <span className="anim-puka absolute w-[18px] h-[18px] rounded-full bg-white/80 bottom-[8%] left-[18%]" aria-hidden />

        <div className="max-w-5xl mx-auto px-5 flex flex-wrap items-center gap-10 relative">
          <div className="flex-1 min-w-[300px] relative z-[5]">
            <Reveal>
              <span
                className="font-maru inline-block text-[13px] font-bold bg-white rounded-full px-5 py-2 mb-6"
                style={{ color: NAVY, boxShadow: '0 4px 0 rgba(0,30,90,.12)' }}
              >
                👥 社会福祉士会のためのチーム情報共有アプリ
              </span>
            </Reveal>
            <Reveal delay={80}>
              <h1 className="font-maru font-extrabold text-[2.1rem] sm:text-5xl lg:text-[3.4rem] leading-[1.45] tracking-wide mb-5" style={{ color: NAVY }}>
                チームの情報共有、<br />
                <span className="inline-block bg-white rounded-full px-4" style={{ color: TEAL }}>まるっと</span>ひとつに。
              </h1>
            </Reveal>
            <Reveal delay={160}>
              <p className="text-[15.5px] font-medium leading-relaxed max-w-lg mb-8" style={{ color: '#5c4a00' }}>
                全体掲示板・班ごとのチーム共有・日程調整・会場の空き確認・活動費請求まで。メールとLINEと紙に散らばっていた会の「伝える」を、ひとつのボードに。
              </p>
            </Reveal>
            <Reveal delay={240}>
              <div className="flex flex-wrap gap-3.5">
                <Link
                  href="/login"
                  className="font-maru inline-flex items-center justify-center gap-2 min-h-[48px] text-[15px] font-bold text-white px-7 rounded-full transition-transform hover:-translate-y-0.5 hover:scale-[1.03] active:scale-95"
                  style={{ background: NAVY, boxShadow: '0 6px 0 #001240' }}
                >
                  ログインして始める
                </Link>
                <a
                  href="#demo"
                  className="font-maru inline-flex items-center justify-center gap-2 min-h-[48px] text-[15px] font-bold bg-white px-7 rounded-full transition-transform hover:-translate-y-0.5 hover:scale-[1.03] active:scale-95"
                  style={{ color: NAVY, boxShadow: '0 6px 0 #e6e2d5' }}
                >
                  <MousePointerClick className="w-4 h-4" />
                  触って体験する
                </a>
              </div>
            </Reveal>
          </div>
          <div className="flex-1 min-w-[280px] relative z-[5] py-3 pb-7">
            <Reveal delay={200}>
              <div className="anim-puka">
                <PhoneMock />
              </div>
            </Reveal>
          </div>
        </div>
        <Wave fill="#ffffff" />
      </div>

      {/* お悩み */}
      <section className="py-20">
        <div className="max-w-5xl mx-auto px-5">
          <Reveal>
            <div className="text-center mb-14">
              <span className="font-maru inline-block text-[13px] font-bold rounded-full px-6 py-1.5 mb-4" style={{ background: '#fff4d1', color: '#8a6d00' }}>
                こんなお悩み、ありませんか？
              </span>
              <h2 className="font-maru font-extrabold text-2xl sm:text-[2.2rem] leading-relaxed" style={{ color: NAVY }}>
                メールとLINEと紙。<br />会の情報、バラバラになっていませんか？
              </h2>
            </div>
          </Reveal>
          <div className="flex flex-wrap justify-center gap-5 sm:gap-9">
            {WORRIES.map((w, i) => (
              <Reveal key={w.who} delay={i * 120}>
                <div className="w-[200px] text-center">
                  <div className="relative bg-gray-100 rounded-3xl px-4 py-4 text-[13.5px] font-semibold leading-relaxed mb-5">
                    {w.bubble}
                    <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 border-x-[10px] border-x-transparent border-t-[10px] border-t-gray-100" aria-hidden />
                  </div>
                  <Face color={w.color} delay={w.delay} />
                  <p className="text-xs text-gray-500 mt-2">{w.who}</p>
                </div>
              </Reveal>
            ))}
          </div>

          {/* 情報の通り道 */}
          <Reveal>
            <div className="text-center mt-20 mb-10">
              <h2 className="font-maru font-extrabold text-xl sm:text-[1.9rem]" style={{ color: NAVY }}>情報の通り道は、3つだけ。</h2>
              <p className="text-sm text-gray-500 mt-2">「誰に向けた話か」でボードが分かれているから、話が混ざりません。</p>
            </div>
          </Reveal>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 max-w-4xl mx-auto">
            {BOARDS.map((b, i) => (
              <Reveal key={b.title} delay={i * 120}>
                <div className="h-full bg-white border border-gray-100 rounded-[28px] px-6 py-8 text-center shadow-sm">
                  <div
                    className="font-maru w-[52px] h-[52px] rounded-full font-extrabold text-xl flex items-center justify-center mx-auto mb-4"
                    style={{ background: b.color, color: b.text, boxShadow: `0 5px 0 ${b.shadow}` }}
                  >
                    {b.mark}
                  </div>
                  <h3 className="font-maru font-extrabold text-[16.5px] mb-2" style={{ color: NAVY }}>{b.title}</h3>
                  <p className="text-[13px] text-gray-500 leading-relaxed">{b.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <Wave fill="#e5f6f4" />

      {/* できること */}
      <section className="py-20 -mt-px" style={{ background: '#e5f6f4' }}>
        <div className="max-w-5xl mx-auto px-5">
          <Reveal>
            <div className="text-center mb-14">
              <span className="font-maru inline-block text-[13px] font-bold bg-white rounded-full px-6 py-1.5 mb-4" style={{ color: TEAL }}>
                RoScope でできること
              </span>
              <h2 className="font-maru font-extrabold text-2xl sm:text-[2.2rem]" style={{ color: NAVY }}>会の運営、ぜんぶこの中に。</h2>
              <p className="text-sm text-gray-500 mt-2">いつもの運営でほんとうに使うものだけを、迷わない数だけ。</p>
            </div>
          </Reveal>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f, i) => (
              <Reveal key={f.title} delay={(i % 3) * 80}>
                <div className="group h-full bg-white rounded-[28px] px-6 py-7 text-center transition-all duration-200 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-teal-200/60">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center text-[26px] mx-auto mb-4 group-hover:anim-yura" style={{ background: f.bg }}>
                    {f.emoji}
                  </div>
                  <h3 className="font-maru font-extrabold text-[17px] mb-2" style={{ color: NAVY }}>{f.title}</h3>
                  <p className="text-[13px] text-gray-500 leading-relaxed">{f.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <Wave fill="#ffffff" />

      {/* インタラクティブデモ */}
      <section id="demo" className="py-20 -mt-px scroll-mt-16 overflow-hidden bg-white">
        <div className="max-w-5xl mx-auto px-5">
          <Reveal>
            <div className="text-center mb-12">
              <span className="font-maru inline-block text-[13px] font-bold rounded-full px-6 py-1.5 mb-4" style={{ background: '#fff4d1', color: '#8a6d00' }}>
                実際の画面をさわってみて！
              </span>
              <h2 className="font-maru font-extrabold text-2xl sm:text-[2.2rem]" style={{ color: NAVY }}>本物そっくりに動くデモです。</h2>
              <p className="text-sm text-gray-500 mt-2 max-w-xl mx-auto">タップ・クリックして、RoScope の操作感をそのまま確かめてください。</p>
            </div>
          </Reveal>
          <Reveal delay={120}>
            <InteractiveDemo />
          </Reveal>
        </div>
      </section>

      <Wave fill="#f0f7e0" />

      {/* はじめかた */}
      <section className="py-20 -mt-px" style={{ background: '#f0f7e0' }}>
        <div className="max-w-5xl mx-auto px-5">
          <Reveal>
            <div className="text-center mb-14">
              <span className="font-maru inline-block text-[13px] font-bold bg-white rounded-full px-6 py-1.5 mb-4" style={{ color: GREEN }}>
                はじめかた
              </span>
              <h2 className="font-maru font-extrabold text-2xl sm:text-[2.2rem]" style={{ color: NAVY }}>きょうから、3ステップ。</h2>
            </div>
          </Reveal>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 max-w-4xl mx-auto">
            {STEPS.map((s, i) => (
              <Reveal key={s.num} delay={i * 120}>
                <div className="h-full bg-white rounded-[28px] px-6 py-8 text-center">
                  <div
                    className="font-maru w-[52px] h-[52px] rounded-full text-white font-extrabold text-[22px] flex items-center justify-center mx-auto mb-4"
                    style={{ background: GREEN, boxShadow: '0 5px 0 #5e8d00' }}
                  >
                    {s.num}
                  </div>
                  <h3 className="font-maru font-extrabold text-[16.5px] mb-2" style={{ color: NAVY }}>{s.title}</h3>
                  <p className="text-[13px] text-gray-500 leading-relaxed">{s.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <Wave fill={YELLOW} />

      {/* CTA */}
      <section className="relative py-20 -mt-px text-center overflow-hidden" style={{ background: YELLOW }}>
        <span className="anim-puka absolute w-[90px] h-[90px] rounded-full bg-white/35 top-[14%] left-[6%]" aria-hidden />
        <span className="anim-puka absolute w-[46px] h-[46px] rounded-full opacity-80 bottom-[22%] right-[4%]" style={{ background: TEAL, animationDelay: '-2s' }} aria-hidden />
        <div className="max-w-3xl mx-auto px-5 relative">
          <Reveal>
            <h2 className="font-maru font-extrabold text-[1.8rem] sm:text-[2.8rem] mb-3" style={{ color: NAVY }}>さあ、はじめよう！</h2>
            <p className="font-medium mb-9" style={{ color: '#5c4a00' }}>むずかしい準備はいりません。今日のひとことから。</p>
            <Link
              href="/login"
              className="font-maru group inline-flex items-center gap-2 min-h-[52px] text-[17px] font-bold text-white px-11 py-3 rounded-full transition-transform hover:-translate-y-0.5 hover:scale-[1.03] active:scale-95"
              style={{ background: NAVY, boxShadow: '0 6px 0 #001240' }}
            >
              ログインして始める
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </Reveal>
        </div>
      </section>

      {/* フッター */}
      <footer className="py-9 text-center" style={{ background: NAVY }}>
        <div className="max-w-5xl mx-auto px-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <RoScopeLogo size="sm" variant="light" />
          <p className="font-maru text-xs tracking-widest text-[#9fb0d4]">&copy; 2026 RoScope. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
