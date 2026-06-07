import React, { memo } from 'react'
import { Link } from 'react-router-dom'

function Footer() {
  return (
    <footer className="w-full border-t border-accent/10 bg-background relative z-10">
      <div className="flex flex-col lg:flex-row justify-between items-center px-6 md:px-12 py-12 lg:py-10 w-full max-w-[1920px] mx-auto gap-8 lg:gap-0 text-center lg:text-left">
        {/* Logo */}
        <Link to="/" className="text-xl font-bold text-accent font-headline tracking-[0.1em] flex items-center gap-2 justify-center lg:justify-start">
          <span className="material-symbols-outlined text-accent text-2xl">view_cozy</span>
          Portly
        </Link>

        {/* Copyright */}
        <div className="text-primary-text/60 font-body text-xs tracking-widest uppercase">
          © {new Date().getFullYear()} Portly Inc. All rights reserved.
        </div>

        {/* Links */}
        <div className="flex flex-wrap justify-center gap-6 md:gap-8 font-body text-[10px] md:text-xs tracking-widest uppercase">
          <a className="text-primary-text/60 hover:text-accent transition-colors" href="#" aria-label="Privacy Policy">Privacy Policy</a>
          <a className="text-primary-text/60 hover:text-accent transition-colors" href="#" aria-label="Terms of Service">Terms</a>
          <a className="text-primary-text/60 hover:text-accent transition-colors" href="#" aria-label="Support">Support</a>
        </div>
      </div>
    </footer>
  )
}

export default memo(Footer)
