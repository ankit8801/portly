import React from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'

export default function Pricing() {
  const { user } = useAuth()

  return (
    <main className="min-h-screen bg-background pt-32 pb-24 px-6 md:px-12">
      <Helmet>
        <title>Pricing | Portly</title>
        <meta name="description" content="Simple, transparent pricing for creators on Portly." />
      </Helmet>

      <div className="max-w-[1400px] mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <span className="font-label text-[10px] tracking-[0.4em] uppercase text-accent mb-4 block">Pricing</span>
          <h1 className="font-headline font-extrabold text-5xl md:text-6xl uppercase tracking-tighter text-primary-text mb-6">
            Simple <span className="italic font-light text-accent">Plans</span>
          </h1>
          <p className="text-primary-text/60 font-body text-lg max-w-2xl mx-auto mb-16">
            Start building your portfolio for free. Upgrade when you need custom domains and advanced analytics.
          </p>
        </motion.div>

        <div className="flex flex-col md:flex-row justify-center items-center gap-8 max-w-4xl mx-auto">
          {/* Free Tier */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="w-full md:w-1/2 p-10 bg-card-bg/50 border border-white/5 rounded-3xl text-left hover:border-accent/30 transition-colors"
          >
            <h2 className="font-headline font-bold text-2xl uppercase tracking-wide text-primary-text mb-2">Creator</h2>
            <div className="flex items-end gap-2 mb-6">
              <span className="font-headline text-5xl font-extrabold text-white">$0</span>
              <span className="text-primary-text/50 font-body mb-1">/ forever</span>
            </div>
            <p className="text-primary-text/60 font-body text-sm mb-8 h-10">Everything you need to launch a beautiful portfolio.</p>
            
            <ul className="flex flex-col gap-4 mb-10 font-body text-sm text-primary-text/80">
              <li className="flex items-center gap-3"><span className="material-symbols-outlined text-accent text-sm">check</span> portly.com/u/username URL</li>
              <li className="flex items-center gap-3"><span className="material-symbols-outlined text-accent text-sm">check</span> Unlimited projects</li>
              <li className="flex items-center gap-3"><span className="material-symbols-outlined text-accent text-sm">check</span> 5MB image uploads</li>
              <li className="flex items-center gap-3 text-primary-text/30"><span className="material-symbols-outlined text-sm">close</span> Custom Domain</li>
              <li className="flex items-center gap-3 text-primary-text/30"><span className="material-symbols-outlined text-sm">close</span> Advanced Analytics</li>
            </ul>

            {user ? (
              <Link to="/dashboard/projects" className="block w-full text-center bg-white/5 border border-white/10 text-white px-6 py-4 rounded-full font-headline text-sm font-bold uppercase tracking-wider hover:bg-white/10 transition-colors">
                Go to Dashboard
              </Link>
            ) : (
              <Link to="/signup" className="block w-full text-center bg-white/5 border border-white/10 text-white px-6 py-4 rounded-full font-headline text-sm font-bold uppercase tracking-wider hover:bg-white/10 transition-colors">
                Get Started
              </Link>
            )}
          </motion.div>

          {/* Pro Tier */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="w-full md:w-1/2 p-10 bg-accent/5 border border-accent/50 shadow-[0_0_50px_rgba(200,169,107,0.1)] rounded-3xl text-left relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 bg-accent text-on-accent text-[10px] font-headline font-bold uppercase tracking-widest px-4 py-1 rounded-bl-xl">Popular</div>
            
            <h2 className="font-headline font-bold text-2xl uppercase tracking-wide text-primary-text mb-2">Pro</h2>
            <div className="flex items-end gap-2 mb-6">
              <span className="font-headline text-5xl font-extrabold text-accent">$12</span>
              <span className="text-primary-text/50 font-body mb-1">/ month</span>
            </div>
            <p className="text-primary-text/60 font-body text-sm mb-8 h-10">Stand out with a professional domain and insights.</p>
            
            <ul className="flex flex-col gap-4 mb-10 font-body text-sm text-primary-text/80">
              <li className="flex items-center gap-3"><span className="material-symbols-outlined text-accent text-sm">check</span> Everything in Creator</li>
              <li className="flex items-center gap-3"><span className="material-symbols-outlined text-accent text-sm">check</span> Custom Domain Connection</li>
              <li className="flex items-center gap-3"><span className="material-symbols-outlined text-accent text-sm">check</span> Remove Portly Branding</li>
              <li className="flex items-center gap-3"><span className="material-symbols-outlined text-accent text-sm">check</span> Advanced Analytics</li>
              <li className="flex items-center gap-3"><span className="material-symbols-outlined text-accent text-sm">check</span> Priority Support</li>
            </ul>

            <button disabled className="w-full bg-accent text-on-accent px-6 py-4 rounded-full font-headline text-sm font-bold uppercase tracking-wider opacity-50 cursor-not-allowed">
              Coming Soon
            </button>
          </motion.div>
        </div>
      </div>
    </main>
  )
}
