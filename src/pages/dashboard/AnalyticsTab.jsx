import React from 'react'
import { motion } from 'framer-motion'

export default function AnalyticsTab() {
  return (
    <div className="space-y-16">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <span className="font-label text-[10px] tracking-[0.3em] uppercase text-accent mb-4 block">Dashboard</span>
          <h1 className="font-headline font-extrabold text-3xl md:text-6xl tracking-tighter text-primary-text uppercase">Project <span className="italic font-light">Analytics</span></h1>
        </div>
      </div>

      <div className="bg-card-bg/30 border border-white/5 p-12 rounded-3xl flex flex-col items-center justify-center text-center">
        <span className="material-symbols-outlined text-6xl text-accent/20 mb-6">query_stats</span>
        <h3 className="font-headline font-bold text-2xl uppercase tracking-wider text-primary-text mb-4">Coming Soon</h3>
        <p className="text-primary-text/60 font-body text-sm max-w-md">
          Advanced project analytics are available on the Pro plan. You will be able to track page views, unique visitors, and project engagement.
        </p>
      </div>
    </div>
  )
}
