import { createClient } from '@/lib/supabase/server'
import { ProfileView } from '@/components/profil/profile-view'
import type { Profile } from '@/lib/types'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Profil',
}

export default async function ProfilPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data } = await supabase
    .from('pc_profiles')
    .select('*')
    .eq('id', user!.id)
    .single()

  const profile = {
    ...data,
    weaknesses: data?.weaknesses ?? [],
    strengths: data?.strengths ?? [],
    goals: data?.goals ?? [],
  } as Profile

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Spielerprofil</h1>
        <p className="text-text-secondary">
          Dein Profil bestimmt die personalisierten Trainingsempfehlungen.
        </p>
      </div>

      <ProfileView profile={profile} />
    </div>
  )
}
