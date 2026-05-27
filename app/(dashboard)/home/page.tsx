import { getSession } from '@/lib/session'
import Link from 'next/link'

const cards = [
  {
    href: '/posts',
    icon: '📋',
    title: '業務連絡',
    desc: '各部署の最新投稿を確認する',
    color: 'from-blue-500 to-indigo-500',
    adminOnly: false,
  },
  {
    href: '/user/register',
    icon: '👤',
    title: 'ユーザー登録',
    desc: '新しいユーザーを追加する',
    color: 'from-green-500 to-teal-500',
    adminOnly: true,
  },
  {
    href: '/departmentjob/register',
    icon: '🏢',
    title: '部署・職種登録',
    desc: '部署や職種を追加する',
    color: 'from-purple-500 to-pink-500',
    adminOnly: true,
  },
  {
    href: '/admin',
    icon: '🗑️',
    title: '管理（削除）',
    desc: 'ユーザー・部署・職種を削除する',
    color: 'from-red-500 to-orange-500',
    adminOnly: true,
  },
]

export default async function HomePage() {
  const session = await getSession()

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">
        ホーム
        <span className="ml-3 text-base font-normal text-gray-500">
          {session?.departmentName} / {session?.jobName}
        </span>
      </h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards
          .filter((c) => !c.adminOnly || session?.adminFlag)
          .map((card) => (
            <Link key={card.href} href={card.href}>
              <div className="bg-white rounded-2xl shadow hover:shadow-md transition-shadow p-6 flex items-start gap-4 cursor-pointer group">
                <div
                  className={`w-12 h-12 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center text-2xl flex-shrink-0`}
                >
                  {card.icon}
                </div>
                <div>
                  <h2 className="font-semibold text-gray-800 group-hover:text-blue-600 transition-colors">
                    {card.title}
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">{card.desc}</p>
                </div>
              </div>
            </Link>
          ))}
      </div>
    </div>
  )
}
