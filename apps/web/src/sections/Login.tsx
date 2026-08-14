import { useState } from 'react'
import { Logo } from '../App'
import { ArrowRight, Loader2 } from 'lucide-react'

export default function Login({ onLogin }: { onLogin: () => void }) {
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) return
    setLoading(true)
    // Simulate auth delay
    setTimeout(() => {
      setLoading(false)
      onLogin()
    }, 800)
  }

  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center bg-background px-6">
      {/* Glow Effect */}
      <div className="pointer-events-none absolute left-1/2 top-1/3 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-volt/20 blur-[100px]" />

      <div className="z-10 w-full max-w-sm animate-rise">
        <div className="flex flex-col items-center mb-12">
          <Logo size={56} />
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-4">
            <div className="relative">
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border-b border-line bg-transparent pb-3 pt-2 text-sm text-foreground transition-colors placeholder:text-muted-foreground focus:border-volt focus:outline-none"
                required
              />
            </div>
            <div className="relative">
              <input
                type="password"
                placeholder="Senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border-b border-line bg-transparent pb-3 pt-2 text-sm text-foreground transition-colors placeholder:text-muted-foreground focus:border-volt focus:outline-none"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="group mt-8 flex w-full items-center justify-center gap-2 rounded-2xl bg-volt py-4 font-display text-[15px] font-bold uppercase tracking-wide text-[#101405] transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-70 disabled:hover:scale-100"
          >
            {loading ? (
              <Loader2 size={20} className="animate-spin text-[#101405]" />
            ) : (
              <>
                Entrar <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
              </>
            )}
          </button>
        </form>

        <p className="mt-8 text-center text-[13px] text-muted-foreground">
          Semana 3 · Mesociclo 2
        </p>
      </div>
    </div>
  )
}
