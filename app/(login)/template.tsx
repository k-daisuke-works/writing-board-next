// ログイン系ページ間（ログイン⇄パスワード再設定等）の遷移をフェードインさせる
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="anim-page-in">{children}</div>
}
