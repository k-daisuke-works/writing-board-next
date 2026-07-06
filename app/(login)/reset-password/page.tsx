import Link from 'next/link'
import ResetPasswordForm from './ResetPasswordForm'

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>
}) {
  const { token } = await searchParams

  if (!token) {
    return (
      <div className="anim-fade-in w-full max-w-md text-center">
        <div className="text-4xl mb-4">⚠️</div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">リンクが無効です</h1>
        <p className="text-sm text-gray-500 mb-8">メールに記載されたリンクからアクセスしてください。</p>
        <Link href="/forgot-password" className="text-sm text-blue-600 hover:text-blue-800 font-medium">再設定メールを再送する</Link>
      </div>
    )
  }

  return <ResetPasswordForm token={token} />
}
