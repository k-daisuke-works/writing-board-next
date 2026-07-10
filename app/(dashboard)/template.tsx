// ページ遷移のたびに再マウントされ、コンテンツをフェードインさせる
// （layout のナビバーは固定のまま、中身だけがぬるっと切り替わる）
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="anim-page-in">{children}</div>
}
