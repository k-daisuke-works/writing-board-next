import {
  MessageSquare, Users, Settings, Receipt, UserCircle, BookOpen,
} from 'lucide-react'

export const STATIC_CARDS = [
  {
    href: '/posts',
    Icon: MessageSquare,
    title: '連絡ボード',
    desc: '各部署の最新連絡を確認する',
    iconBg: 'bg-blue-50',
    iconColor: 'text-blue-600',
    adminOnly: false,
  },
  {
    href: '/members',
    Icon: Users,
    title: 'メンバー一覧',
    desc: 'メンバーのプロフィールを確認する',
    iconBg: 'bg-teal-50',
    iconColor: 'text-teal-600',
    adminOnly: false,
  },
  {
    href: '/expenses',
    Icon: Receipt,
    title: '活動費請求',
    desc: '活動費の請求フォームを開く',
    iconBg: 'bg-orange-50',
    iconColor: 'text-orange-600',
    adminOnly: false,
  },
  {
    href: '/manual',
    Icon: BookOpen,
    title: '使い方マニュアル',
    desc: 'システムの操作方法を確認する',
    iconBg: 'bg-sky-50',
    iconColor: 'text-sky-600',
    adminOnly: false,
  },
  {
    href: '/admin',
    Icon: Settings,
    title: '組織管理',
    desc: 'メンバー・部署・職種の登録・管理',
    iconBg: 'bg-gray-50',
    iconColor: 'text-gray-600',
    adminOnly: true,
  },
] as const

export function buildCards(role: string, userKey: number) {
  return [
    ...STATIC_CARDS.filter(c => !c.adminOnly || role !== 'member'),
    {
      href: `/member/${userKey}`,
      Icon: UserCircle,
      title: 'プロフィール編集',
      desc: '自己紹介やアイコンを設定する',
      iconBg: 'bg-indigo-50',
      iconColor: 'text-indigo-600',
    },
  ]
}
