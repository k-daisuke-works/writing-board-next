import { getSession } from '@/lib/session'
import Link from 'next/link'
import { MessageSquare, Users, Building2, Settings, ChevronRight } from 'lucide-react'

const CARDS = [
  {
    href: '/posts',
    Icon: MessageSquare,
    title: '連絡ボード',
    desc: '各部署の最新業務連絡を確認する',
    iconBg: 'bg-blue-50',
    iconColor: 'text-blue-600',
    adminOnly: false,
  },
  {
    href: '/user/register',
    Icon: Users,
    title: 'ユーザー管理',
    desc: '新しいメンバーを招待・追加する',
    iconBg: 'bg-green-50',
    iconColor: 'text-green-600',
    adminOnly: true,
  },
  {
    href: '/departmentjob/register',
    Icon: Building2,
    title: '部署・職種登録',
    desc: '組織の部署や職種を設定する',
    iconBg: 'bg-purple-50',
    iconColor: 'text-purple-600',
    adminOnly: true,
  },
  {
    href: '/admin',
    Icon: Settings,
    title: '管理設定',
    desc: 'ユーザーや組織情報を管理・削除する',
    iconBg: 'bg-gray-50',
    iconColor: 'text-gray-600',
    adminOnly: true,
  },
]

export default async function HomePage() {
  const session = await getSession()
  const cards   = CARDS.filter((c) => !c.adminOnly || session?.adminFlag)

  return (
    <div className="anim-fade-in">
      {/* ページヘッダー */}
      <div className="mb-7">
        <h1 className="text-xl font-semibold text-gray-900">
          おはようございます、{session?.userName}さん
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {session?.organizationName}
          {session?.departmentName && ` · ${session.departmentName}`}
          {session?.jobName && ` · ${session.jobName}`}
        </p>
      </div>

      {/* メニューカード */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {cards.map(({ href, Icon, title, desc, iconBg, iconColor }) => (
          <Link key={href} href={href} className="group">
            <div className="bg-white border border-gray-200 rounded-lg p-5 hover:border-blue-300 hover:shadow-sm transition-all duration-150 flex flex-col gap-4 h-full">
              <div className={`w-10 h-10 ${iconBg} rounded-lg flex items-center justify-center`}>
                <Icon className={`w-5 h-5 ${iconColor}`} strokeWidth={1.75} />
              </div>
              <div className="flex-1">
                <h2 className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                  {title}
                </h2>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">{desc}</p>
              </div>
              <div className="flex items-center text-xs text-gray-400 group-hover:text-blue-500 transition-colors">
                開く <ChevronRight className="w-3.5 h-3.5 ml-0.5 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
