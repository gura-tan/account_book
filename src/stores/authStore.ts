import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import type { Session, User } from '@supabase/supabase-js'

interface AuthState {
  session: Session | null
  user: User | null
  activeGroupId: string | null
  loading: boolean
  initialized: boolean
  signUp: (email: string, password: string, displayName: string) => Promise<{ error: string | null }>
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  initialize: () => void
}

let isInitializing = false

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  user: null,
  activeGroupId: null,
  loading: false,
  initialized: false,

  signUp: async (email, password, displayName) => {
    set({ loading: true })
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: displayName },
      },
    })
    if (error) {
      set({ loading: false })
      return { error: error.message }
    }
    // Wait a brief moment for the Supabase trigger to create the group if signing up
    if (!error && data.user) {
      setTimeout(async () => {
        const { data: memberData } = await supabase
          .from('group_members')
          .select('group_id')
          .eq('user_id', data.user!.id)
          .limit(1)
          .single()
        
        set({
          session: data.session,
          user: data.user,
          activeGroupId: memberData?.group_id || null,
          loading: false,
        })
      }, 500)
    } else {
      set({
        session: data.session,
        user: data.user,
        loading: false,
      })
    }
    return { error: (error as any)?.message || null }
  },

  signIn: async (email, password) => {
    set({ loading: true })
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) {
      set({ loading: false })
      return { error: error.message }
    }
    if (!error && data.user) {
      const { data: memberData } = await supabase
        .from('group_members')
        .select('group_id')
        .eq('user_id', data.user.id)
        .limit(1)
        .single()
        
      set({
        session: data.session,
        user: data.user,
        activeGroupId: memberData?.group_id || null,
        loading: false,
      })
    } else {
      set({
        session: null,
        user: null,
        loading: false,
      })
    }
    return { error: (error as any)?.message || null }
  },

  signOut: async () => {
    await supabase.auth.signOut()
    set({ session: null, user: null, activeGroupId: null })
  },

  initialize: () => {
    if (isInitializing) return
    isInitializing = true

    // Fallback timer to prevent infinite loading if Supabase getSession hangs on a broken lock
    const fallbackTimer = setTimeout(() => {
      if (!useAuthStore.getState().initialized) {
        console.warn('Supabase auth initialization timed out. Forcing initialized state to recover UI.')
        set({ initialized: true })
      }
    }, 2000)

    supabase.auth.getSession().then(async ({ data: { session }, error }) => {
      clearTimeout(fallbackTimer)
      if (error) console.error('Auth Init Error:', error)
      
      let activeGroupId = null
      if (session?.user) {
        try {
          const { data: memberData } = await supabase
            .from('group_members')
            .select('group_id')
            .eq('user_id', session.user.id)
            .limit(1)
            .maybeSingle()
          activeGroupId = memberData?.group_id || null
        } catch (e) {
          console.error('Group fetch error:', e)
        }
      }
      set({ session, user: session?.user ?? null, activeGroupId, initialized: true })
    }).catch(err => {
      clearTimeout(fallbackTimer)
      console.error('Session promise error:', err)
      set({ initialized: true })
    })

    supabase.auth.onAuthStateChange(async (_event, session) => {
      let activeGroupId = null
      if (session?.user) {
        try {
          const { data: memberData } = await supabase
            .from('group_members')
            .select('group_id')
            .eq('user_id', session.user.id)
            .limit(1)
            .maybeSingle()
          activeGroupId = memberData?.group_id || null
        } catch (e) {
          console.error('Auth change group fetch error:', e)
        }
      }
      set({ session, user: session?.user ?? null, activeGroupId })
    })
  },
}))
