// アプリの更新履歴。ログインページ（最新3件）で表示する。
export type AnnouncementType = 'release' | 'feature' | 'improvement' | 'fix'

export type Announcement = {
  date: string
  version: string
  type: AnnouncementType
  title: string
  desc: string
}

export const ANNOUNCEMENTS: Announcement[] = [
  {
    date: '2026.06.03',
    version: 'v1.4',
    type: 'feature',
    title: '3段階ロール制を導入',
    desc: '管理者・リーダー・メンバーの3段階でアクセス権限を細かく設定できるようになりました。',
  },
  {
    date: '2026.05.20',
    version: 'v1.3',
    type: 'feature',
    title: 'プッシュ通知に対応',
    desc: '重要マークのついた投稿が作成されたとき、スマホへリアルタイム通知が届きます。',
  },
  {
    date: '2026.05.10',
    version: 'v1.2',
    type: 'improvement',
    title: 'リアクション・返信機能を追加',
    desc: '投稿に絵文字リアクションや返信コメントができるようになりました。',
  },
  {
    date: '2026.04.28',
    version: 'v1.1',
    type: 'improvement',
    title: 'プロフィール・アバター機能',
    desc: 'メンバーのプロフィール写真とプロフィールページを追加しました。',
  },
  {
    date: '2026.04.01',
    version: 'v1.0',
    type: 'release',
    title: 'RoScope 正式リリース',
    desc: 'チーム情報共有ボード「RoScope」を正式リリースしました。',
  },
]
