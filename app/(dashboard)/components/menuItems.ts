import {
  MessageSquare, Users, Settings, Receipt, UserCircle, BookOpen, KeyRound, FolderOpen, Camera,
} from 'lucide-react'

export const STATIC_CARDS = [
  {
    href: '/posts',
    Icon: MessageSquare,
    title: '全体掲示板',
    desc: '全部署から組織全体へのお知らせを確認する',
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
    href: '/documents',
    Icon: FolderOpen,
    title: '資料庫',
    desc: '投稿に添付された資料・写真を横断で見る',
    iconBg: 'bg-amber-50',
    iconColor: 'text-amber-600',
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

// Instagram カードは組織が連携済み（instagram_accounts に行がある）のときだけ表示する
const SNS_CARD = {
  href: '/sns',
  Icon: Camera,
  title: '会のInstagram',
  desc: '会の公式Instagramの投稿を見る',
  iconBg: 'bg-pink-50',
  iconColor: 'text-pink-600',
} as const

export function buildCards(role: string, userKey: number, hasInstagram = false) {
  return [
    ...STATIC_CARDS.filter(c => !c.adminOnly || role !== 'member'),
    ...(hasInstagram ? [SNS_CARD] : []),
    {
      href: `/member/${userKey}`,
      Icon: UserCircle,
      title: 'プロフィール編集',
      desc: '自己紹介やアイコンを設定する',
      iconBg: 'bg-indigo-50',
      iconColor: 'text-indigo-600',
    },
    {
      href: '/change-password',
      Icon: KeyRound,
      title: 'パスワード変更',
      desc: 'ログインパスワードを変更する',
      iconBg: 'bg-yellow-50',
      iconColor: 'text-yellow-600',
    },
  ]
}
