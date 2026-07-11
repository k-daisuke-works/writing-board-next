import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export const maxDuration = 60

const BUCKET = 'backups'
const RETENTION_DAYS = 14

/**
 * 日次バックアップ（無料プランは自動バックアップ対象外のための自衛策）。
 * DB関数 export_all_data() で全テーブルを JSON 化し、同プロジェクトの
 * 非公開バケットに保存（国内保管を維持）。14日分ローテーション。
 * 復元手順は docs/HANDOFF.md「バックアップと復元」を参照。
 */
export async function GET(req: NextRequest) {
  // Vercel cron authorization（secret 未設定時は常に拒否 = fail-closed）
  const auth = req.headers.get('authorization')
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // tenant-ok: Cron（CRON_SECRET 認証・セッション文脈なし）。全組織横断のシステムバックアップ
  const supabase = createServiceClient()

  const { data: dump, error: exportError } = await supabase.rpc('export_all_data')
  if (exportError || !dump) {
    return NextResponse.json({ error: `エクスポート失敗: ${exportError?.message ?? 'empty'}` }, { status: 500 })
  }

  const stamp = new Date().toISOString().slice(0, 10) // UTC日付。同日再実行は上書き
  const path = `db/backup-${stamp}.json`
  const body = JSON.stringify({ exported_at: new Date().toISOString(), tables: dump })

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, body, { contentType: 'application/json', upsert: true })
  if (uploadError) {
    return NextResponse.json({ error: `保存失敗: ${uploadError.message}` }, { status: 500 })
  }

  // ローテーション: 保持期間を過ぎたファイルを削除
  const removed: string[] = []
  const { data: files } = await supabase.storage.from(BUCKET).list('db', { limit: 100 })
  const cutoff = Date.now() - RETENTION_DAYS * 864e5
  const stale = (files ?? [])
    .filter(f => f.name.startsWith('backup-') && new Date(f.name.slice(7, 17)).getTime() < cutoff)
    .map(f => `db/${f.name}`)
  if (stale.length > 0) {
    await supabase.storage.from(BUCKET).remove(stale)
    removed.push(...stale)
  }

  return NextResponse.json({ ok: true, saved: path, bytes: body.length, removed })
}
