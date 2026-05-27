import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

/**
 * 環境変数とSupabase接続を診断するエンドポイント
 * https://writing-board-next.vercel.app/api/debug にアクセスして確認
 */
export async function GET() {
  // 環境変数チェック（URLは最初の40文字まで表示してタイポ確認、キーは存在確認のみ）
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  const envChecks = {
    NEXT_PUBLIC_SUPABASE_URL:      url ? url.slice(0, 50) : '未設定',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY:     !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    JWT_SECRET:                    !!process.env.JWT_SECRET,
  }

  // Supabase 接続テスト
  let supabaseTest: { ok: boolean; error?: string; rowCount?: number } = { ok: false }
  try {
    const supabase = await createServiceClient()
    const { data, error } = await supabase
      .from('organization_data')
      .select('organization_key', { count: 'exact', head: false })
    if (error) {
      supabaseTest = { ok: false, error: error.message }
    } else {
      supabaseTest = { ok: true, rowCount: data?.length ?? 0 }
    }
  } catch (e: unknown) {
    supabaseTest = { ok: false, error: String(e) }
  }

  return NextResponse.json(
    {
      status: 'debug',
      envVars: envChecks,
      supabase: supabaseTest,
    },
    { status: 200 }
  )
}
