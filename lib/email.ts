import nodemailer from 'nodemailer'
import type { Transporter } from 'nodemailer'

// SMTP は遅延初期化（モジュールレベル初期化は env 未設定時にデプロイ全体を壊す）
// 必要な環境変数: SMTP_HOST / SMTP_PORT / SMTP_USER / SMTP_PASS / MAIL_FROM
// Gmail の場合: smtp.gmail.com / 465 / Gmailアドレス / アプリパスワード
let transporter: Transporter | null | undefined
function getTransporter(): Transporter | null {
  if (transporter !== undefined) return transporter
  const host = process.env.SMTP_HOST
  const port = Number(process.env.SMTP_PORT)
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS
  if (!host || !port || !user || !pass) {
    transporter = null
    return null
  }
  transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  })
  return transporter
}

/** メール送信が設定済みかどうか（UI の出し分けに使う） */
export function isMailConfigured(): boolean {
  return getTransporter() !== null
}

/** メールを送信する。失敗しても throw せず false を返す */
export async function sendMail(to: string, subject: string, text: string): Promise<boolean> {
  const t = getTransporter()
  if (!t) return false
  try {
    await t.sendMail({
      from: process.env.MAIL_FROM ?? process.env.SMTP_USER,
      to,
      subject,
      text,
    })
    return true
  } catch (e) {
    console.error('[sendMail] failed:', e instanceof Error ? e.message : e)
    return false
  }
}
