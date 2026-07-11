#!/usr/bin/env node
// テナント分離の機械検査（CLAUDE.md 絶対ルール①）
//
// RLS を使わない本プロジェクトでは、全DBクエリの
// `.eq('organization_key', ...)` がテナント分離の唯一の防衛線。
// このスクリプトは actions/ app/ lib/ の全 `.from('テーブル')` チェーンを走査し、
// チェーン内に organization_key が現れないものを違反として報告する（exit 1）。
//
// ヒューリスティックな静的検査であり、意味的な正しさ（正しい orgKey を
// 渡しているか等）は tenant-audit エージェントで別途監査する。
//
// 免除:
// - EXEMPT_TABLES: organization_key カラムを持たない/持てないテーブル
// - インライン注釈: `.from(...)` と同じ行か直前行に `tenant-ok: 理由` を書く
//   （理由必須。organization_key 以外の手段でスコープが保証される場合のみ）

import { readdirSync, readFileSync } from 'node:fs'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

// URL.pathname は Windows で '/C:/...' を返しパス結合が壊れるため fileURLToPath を使う
const ROOT = fileURLToPath(new URL('..', import.meta.url))
const SCAN_DIRS = ['actions', 'app', 'lib']

const EXEMPT_TABLES = new Set([
  'organization_data', // テナント解決の根（organization_id からの逆引きを含む）
  'welfare_news',      // 全団体共通の RSS キャッシュ（organization_key カラムなし）
  'schedule_dates',    // organization_key カラムなし（org 検証済み event_id 経由でスコープ）
  'schedule_responses',// 同上
])

// チェーンの終端とみなす境界: 次のクエリ開始 / 空行 / 上限文字数
const WINDOW_MAX = 800

function* walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue
    const path = join(dir, entry.name)
    if (entry.isDirectory()) yield* walk(path)
    else if (/\.tsx?$/.test(entry.name)) yield path
  }
}

const violations = []
let checked = 0

for (const dir of SCAN_DIRS) {
  for (const file of walk(join(ROOT, dir))) {
    const src = readFileSync(file, 'utf8')
    const re = /\.from\(\s*'([a-z_]+)'\s*\)/g
    let m
    while ((m = re.exec(src)) !== null) {
      // Storage の .from(bucket) は対象外
      const before = src.slice(Math.max(0, m.index - 40), m.index)
      if (/storage\s*$/.test(before) || /\.storage\s*\.?\s*$/.test(before)) continue

      const table = m[1]
      checked++
      if (EXEMPT_TABLES.has(table)) continue

      // インライン注釈（同じ行 or 直前行の tenant-ok: 理由）
      const lineStart = src.lastIndexOf('\n', m.index) + 1
      const lineEnd = src.indexOf('\n', m.index)
      const prevLineStart = src.lastIndexOf('\n', lineStart - 2) + 1
      const annotated = /tenant-ok:\s*\S/.test(
        src.slice(prevLineStart, lineEnd === -1 ? src.length : lineEnd),
      )
      if (annotated) continue

      // チェーンの走査ウィンドウ: 次の .from( / 空行 / 上限 のうち最も近い位置まで
      const rest = src.slice(m.index + m[0].length, m.index + m[0].length + WINDOW_MAX)
      const nextFrom = rest.search(/\.from\(\s*'/)
      const blankLine = rest.search(/\n[ \t]*\n/)
      const end = Math.min(
        ...[nextFrom, blankLine, WINDOW_MAX].filter((i) => i >= 0),
      )
      const chain = rest.slice(0, end)

      if (!chain.includes('organization_key')) {
        const line = src.slice(0, m.index).split('\n').length
        violations.push({ file: relative(ROOT, file), line, table })
      }
    }
  }
}

if (violations.length > 0) {
  console.error(`❌ organization_key フィルタのないクエリチェーン: ${violations.length} 件\n`)
  for (const v of violations) {
    console.error(`  ${v.file}:${v.line}  .from('${v.table}')`)
  }
  console.error(
    '\n対応: .eq(\'organization_key\', session.organizationKey) を追加するか、' +
    '\n組織スコープが別の手段で保証される場合のみ `// tenant-ok: 理由` を同じ行か直前行に付ける。',
  )
  process.exit(1)
}

console.log(`✅ tenant-isolation check: ${checked} クエリチェーンを検査、違反なし`)
