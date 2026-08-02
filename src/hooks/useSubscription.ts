import { useEffect, useState } from 'react'
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react' // ou a lib de auth que você usa
import { AccessCheckResult, getUserAiAccess } from '../lib/subscription'

export function useSubscription() {
  const supabase = useSupabaseClient()
  const user = useUser()

  const [loading, setLoading] = useState(true)
  const [access, setAccess] = useState<AccessCheckResult>({
    hasAccess: false,
    reason: 'no_subscription',
    daysRemaining: null,
  })

  useEffect(() => {
    async function fetchAccess() {
      if (!user) {
        setAccess({ hasAccess: false, reason: 'no_subscription', daysRemaining: null })
        setLoading(false)
        return
      }

      setLoading(true)
      const accessResult = await getUserAiAccess(supabase, user.id)
      setAccess(accessResult)
      setLoading(false)
    }

    fetchAccess()
  }, [user?.id, supabase])

  return { ...access, loading }
}