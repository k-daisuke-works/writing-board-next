import {
  MessageSquare, Users, Building2, Settings, Receipt, UserCircle, BookOpen,
} from 'lucide-react'

export const STATIC_CARDS = [
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
] as const

export function buildCards(adminFlag: boolean, userKey: number) {
  return [
    ...STATIC_CARDS.filter(c => !c.adminOnly || adminFlag),
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
