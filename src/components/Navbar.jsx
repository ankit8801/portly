import React, { useState, useEffect, memo } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../context/AuthContext'

const navLinks = [
  { label: 'Home', path: '/' },
  { label: 'Creators', path: '/explore-creators' },
  { label: 'Projects', path: '/explore-projects' },
  { label: 'Pricing', path: '/pricing' },
]

function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const location = useLocation()
  const { user } = useAuth()

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    setMobileOpen(false)
    document.body.style.overflow = ''
  }, [location.pathname])

  const toggleMobile = () => {
    setMobileOpen(prev => {
      document.body.style.overflow = !prev ? 'hidden' : ''
      return !prev
    })
  }

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="fixed top-0 w-full z-[60] transition-colors duration-500"
        style={{
          backgroundColor: scrolled ? 'rgba(13, 7, 4, 0.9)' : 'rgba(13, 7, 4, 0.4)',
          backdropFilter: scrolled ? 'blur(20px)' : 'blur(0px)',
          borderBottom: scrolled ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(255, 255, 255, 0)'
        }}
      >
        <div className="flex justify-between items-center w-full px-6 md:px-12 py-4 md:py-6 max-w-[1920px] mx-auto">
          <Link to="/" className="text-xl md:text-2xl font-bold tracking-[0.1em] text-primary-text font-headline flex items-center gap-2" aria-label="Portly Home">
            <span className="material-symbols-outlined text-accent text-3xl">view_cozy</span>
            Portly
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-12 font-headline tracking-[0.05em] uppercase text-sm font-medium">
            {navLinks.map(link => (
              <motion.div key={link.path} whileHover={{ y: -2 }} transition={{ duration: 0.2 }}>
                <Link
                  to={link.path}
                  className={`transition-colors duration-300 ${
                    location.pathname === link.path
                      ? 'text-accent border-b border-accent pb-1'
                      : 'text-primary-text hover:text-accent'
                  }`}
                >
                  {link.label}
                </Link>
              </motion.div>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link
                  to="/dashboard/projects"
                  className="bg-accent text-on-accent px-6 py-2 rounded-full font-headline text-sm font-bold uppercase tracking-wider hover:brightness-110 transition-all duration-300 shadow-lg inline-flex items-center gap-2"
                >
                  Dashboard
                  <span className="material-symbols-outlined text-sm">dashboard</span>
                </Link>
              </motion.div>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-primary-text hover:text-accent font-headline text-sm font-bold uppercase tracking-wider transition-colors px-4 py-2"
                >
                  Sign In
                </Link>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Link
                    to="/signup"
                    className="bg-accent text-on-accent px-6 py-2 rounded-full font-headline text-sm font-bold uppercase tracking-wider hover:brightness-110 transition-all duration-300 shadow-lg inline-block"
                  >
                    Sign Up
                  </Link>
                </motion.div>
              </>
            )}
          </div>

        </div>
      </motion.nav>

      {/* Mobile Hamburger */}
      <div className={`md:hidden fixed top-4 right-6 z-[100] flex items-center justify-center ${mobileOpen ? 'bg-black/40' : 'bg-black/60'} backdrop-blur-md rounded-full p-1 border border-[#C8A96B]/30 shadow-[0_4px_20px_rgba(0,0,0,0.6)] transition-all duration-300`}>
        <motion.button
          whileTap={{ scale: 0.95 }}
          className="flex items-center justify-center p-2 text-white hover:text-accent transition-colors active:scale-95 transition-all duration-200"
          onClick={toggleMobile}
          aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={mobileOpen}
        >
          <span className="material-symbols-outlined text-3xl">{mobileOpen ? 'close' : 'menu'}</span>
        </motion.button>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            key="mobile-nav"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[90] flex flex-col items-center justify-center pointer-events-auto"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.4)', backdropFilter: 'blur(20px)' }}
          >
            <div className="flex flex-col items-center gap-10 font-headline tracking-widest text-2xl md:text-3xl font-medium uppercase">
              {navLinks.map((link, idx) => (
                <motion.div
                  key={link.path}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1, duration: 0.4 }}
                >
                  <Link
                    to={link.path}
                    className={`transition-all duration-300 ${
                      location.pathname === link.path
                        ? 'text-accent'
                        : 'text-primary-text hover:text-accent'
                    }`}
                    onClick={toggleMobile}
                  >
                    {link.label}
                  </Link>
                </motion.div>
              ))}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: navLinks.length * 0.1, duration: 0.4 }}
              >
                {user ? (
                  <Link
                    to="/dashboard/projects"
                    className="mt-6 bg-accent text-on-accent px-12 py-4 rounded-full font-headline text-sm font-bold uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all duration-300 shadow-2xl flex items-center gap-2"
                    onClick={toggleMobile}
                  >
                    Dashboard <span className="material-symbols-outlined">dashboard</span>
                  </Link>
                ) : (
                  <Link
                    to="/signup"
                    className="mt-6 bg-accent text-on-accent px-12 py-4 rounded-full font-headline text-sm font-bold uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all duration-300 shadow-2xl"
                    onClick={toggleMobile}
                  >
                    Sign Up Free
                  </Link>
                )}
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

export default memo(Navbar)
