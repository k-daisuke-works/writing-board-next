import { getSession } from '@/lib/session'
import Link from 'next/link'

const CARDS = [
  {
    href: '/posts',
    icon: '📋',
    title: '連絡ボード',
    desc: '各部署の最新業務連絡を確認',
    gradient: 'from-blue-500 to-indigo-600',
    adminOnly: false,
  },
  {
    href: '/user/register',
    icon: '👤',
    title: 'ユーザー管理',
    desc: '新しいメンバーを招待・追加',
    gradient: 'from-emerald-500 to-teal-600',
    adminOnly: true,
  },
  {
    href: '/departmentjob/register',
    icon: '🏢',
    title: '部署・職種',
    desc: '組織構造を設定・管理する',
    gradient: 'from-violet-500 to-purple-600',
    adminOnly: true,
  },
  {
    href: '/admin',
    icon: '⚙️',
    title: '管理設定',
    desc: 'ユーザーや組織情報の削除',
    gradient: 'from-rose-500 to-red-600',
    adminOnly: true,
  },
]

export default async function HomePage() {
  const session = await getSession()
  const visibleCards = CARDS.filter((c) => !c.adminOnly || session?.adminFlag)

  return (
    <div>
      {/* あいさつ */}
      <div className="mb-8">
        <p className="text-sm text-slate-400 mb-1">ようこそ</p>
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
          {session?.userName}<span className="font-normal text-slate-400 text-xl"> さん 👋</span>
        </h1>
        {(session?.departmentName || session?.jobName) && (
          <p className="text-sm text-slate-400 mt-1">
            {[session.departmentName, session.jobName].filter(Boolean).join(' · ')}
          </p>
        )}
      </div>

      {/* メニューカード */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {visibleCards.map((card) => (
          <Link key={card.href} href={card.href} className="group">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all duration-200 p-6 flex items-start gap-4 hover:-translate-y-0.5">
              <div
                className={`w-11 h-11 rounded-xl bg-gradient-to-br ${card.gradient} flex items-center justify-center text-xl shadow-sm flex-shrink-0`}
              >
                {card.icon}
              </div>
              <div className="min-w-0">
                <h2 className="font-semibold text-slate-800 group-hover:text-indigo-600 transition-colors leading-tight">
                  {card.title}
                </h2>
                <p className="text-sm text-slate-400 mt-1 leading-snug">{card.desc}</p>
              </div>
              <div className="ml-auto text-slate-300 group-hover:text-indigo-400 transition-colors text-lg self-center">
                →
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
