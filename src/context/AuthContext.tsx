import { createContext, useContext, useMemo, useReducer } from 'react'

type AuthState = {
  isAuthenticated: boolean
  userId: string | null
}

type Action =
  | { type: 'login'; userId: string }
  | { type: 'logout' }

const AuthContext = createContext<{
  state: AuthState
  login: (userId: string) => void
  logout: () => void
} | null>(null)

function reducer(state: AuthState, action: Action): AuthState {
  switch (action.type) {
    case 'login':
      return { isAuthenticated: true, userId: action.userId }
    case 'logout':
      return { isAuthenticated: false, userId: null }
    default:
      return state
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, { isAuthenticated: false, userId: null })
  const value = useMemo(
    () => ({ state, login: (userId: string) => dispatch({ type: 'login', userId }), logout: () => dispatch({ type: 'logout' }) }),
    [state],
  )
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}


