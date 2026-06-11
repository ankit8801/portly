import React, { useState, useEffect } from 'react'
import { Helmet } from 'react-helmet-async'
import { logoutUser } from '../supabase/services/authService'
import { useAuth } from '../context/AuthContext'
import { useNavigate, Outlet, useLocation, Link, NavLink } from 'react-router-dom'

export default function DashboardLayout() {
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user && profile) {
      setLoading(false)
    } else if (!user) {
      navigate('/login', { replace: true })
    }
  }, [user, profile, navigate])

  const handleLogout = async () => {
    try {
      await logoutUser()
      navigate('/login', { replace: true })
    } catch (error) {
      console.error(error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const tabs = [
    { id: 'projects', icon: 'palette', label: 'Projects', path: '/dashboard/projects' },
    { id: 'portfolio', icon: 'web', label: 'Portfolio', path: '/dashboard/portfolio' },
    { id: 'analytics', icon: 'analytics', label: 'Analytics', path: '/dashboard/analytics' },
    { id: 'settings', icon: 'settings', label: 'Settings', path: '/dashboard/settings' }
  ]

  const currentTab = tabs.find(t => location.pathname.includes(t.path)) || tabs[0]

  return (
    <main className="min-h-screen bg-background flex">
      <Helmet>
        <title>Dashboard | Portly</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <aside className="w-20 md:w-64 border-r border-white/5 flex flex-col bg-background z-20">
        <div className="p-6 md:p-8 border-b border-white/5 flex flex-col justify-center md:justify-start">
          <Link to="/" className="font-headline font-black text-xl tracking-tighter text-primary-text flex items-center gap-2">
            <span className="material-symbols-outlined text-accent hidden md:block">view_cozy</span>
            Portly
          </Link>
          <span className="hidden md:block text-xs text-foreground/40 mt-1">@{profile?.username}</span>
        </div>
        <nav className="flex-1 py-8 px-4 flex flex-col gap-2">
          {tabs.map((item) => (
            <NavLink
              key={item.id}
              to={item.path}
              className={({ isActive }) => `flex items-center gap-4 p-3 md:px-4 rounded-xl transition-all group ${
                isActive ? 'bg-accent/10 text-accent' : 'text-primary-text/40 hover:bg-white/5 hover:text-primary-text'
              }`}
            >
              <span className="material-symbols-outlined text-2xl">
                {item.icon}
              </span>
              <span className="hidden md:block font-headline text-xs font-bold uppercase tracking-[0.1em]">{item.label}</span>
            </NavLink>
          ))}
          <a
            href={`/u/${profile?.username}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-4 p-3 md:px-4 rounded-xl text-primary-text/40 hover:bg-white/5 hover:text-primary-text transition-all mt-4 border border-white/5"
          >
            <span className="material-symbols-outlined text-2xl">open_in_new</span>
            <span className="hidden md:block font-headline text-xs font-bold uppercase tracking-[0.1em]">View Live</span>
          </a>
        </nav>
        <div className="p-4 border-t border-white/5">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-4 p-3 md:px-4 text-red-400/60 hover:text-red-400 hover:bg-red-400/5 rounded-xl transition-all"
          >
            <span className="material-symbols-outlined">logout</span>
            <span className="hidden md:block font-headline text-xs font-bold uppercase tracking-[0.1em]">Sign Out</span>
          </button>
        </div>
      </aside>

      <section className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <header className="h-20 border-b border-white/5 flex flex-row items-center justify-between px-4 md:px-12 sticky top-0 bg-background/80 backdrop-blur-md z-10">
          <h2 className="font-headline text-xs md:text-sm font-bold uppercase tracking-[0.2em] text-primary-text/60">
            {currentTab.label}
          </h2>
        </header>

        <div className="p-4 md:p-12 lg:p-16 max-w-7xl">
          <Outlet />
        </div>
      </section>
    </main>
  )
}
