import { getSession } from '@/lib/session'
import { createServiceClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import HomeClient from './HomeClient'

export default async function HomePage() {
  const session = await getSession()
  if (!session) redirect('/login')

  // Instagram カードは組織が連携済みのときだけメニューに出す
  const supabase = createServiceClient()
  const { count } = await supabase
    .from('instagram_accounts')
    .select('organization_key', { count: 'exact', head: true })
    .eq('organization_key', session.organizationKey)

  return <HomeClient session={session} hasInstagram={(count ?? 0) > 0} />
}
