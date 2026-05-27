// パスワードリセットスクリプト
// 使い方: node scripts/reset-password.mjs

import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'
import readline from 'readline'

const supabase = createClient(
  'https://ajyyoifxatincvflzcpb.supabase.co',
  // .env.local から SUPABASE_SERVICE_ROLE_KEY を読む
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function main() {
  // 1. 組織一覧を表示
  const { data: orgs } = await supabase.from('organization_data').select('organization_key, organization_id, organization_name')
  console.log('\n=== 登録済み団体 ===')
  orgs?.forEach(o => console.log(`  [${o.organization_key}] ${o.organization_id} - ${o.organization_name}`))

  // 2. ユーザー一覧を表示
  const { data: users } = await supabase.from('user_info').select('user_key, user_id, user_name, organization_key, admin_flag')
  console.log('\n=== 登録済みユーザー ===')
  users?.forEach(u => console.log(`  [${u.user_key}] ${u.user_id} (${u.user_name}) org:${u.organization_key} admin:${u.admin_flag}`))

  if (!users?.length) {
    console.log('ユーザーが見つかりません。')
    return
  }

  // 3. パスワードをリセット
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
  const ask = (q) => new Promise(r => rl.question(q, r))

  const userId   = await ask('\nリセットするユーザーID (例: USER001): ')
  const newPass  = await ask('新しいパスワード (8文字以上): ')
  rl.close()

  const hashed = await bcrypt.hash(newPass, 10)
  const { error } = await supabase
    .from('user_info')
    .update({ password: hashed })
    .eq('user_id', userId.trim())

  if (error) {
    console.error('エラー:', error.message)
  } else {
    console.log(`✅ ${userId} のパスワードをリセットしました。`)
  }
}

main().catch(console.error)
