import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { motion } from 'framer-motion'
import { getUsersPage } from '../firebase/services/userService'

export default function ExploreCreators() {
  const [creators, setCreators] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [lastDoc, setLastDoc] = useState(null)
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(false)

  const loadCreators = async (isNextPage = false) => {
    if (loading) return
    setLoading(true)
    try {
      const res = await getUsersPage(isNextPage ? lastDoc : null, 20)
      if (isNextPage) {
        setCreators(prev => [...prev, ...res.users])
      } else {
        setCreators(res.users)
      }
      setLastDoc(res.lastDoc)
      setHasMore(res.hasMore)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCreators()
  }, [])

  const filteredCreators = creators.filter(user => 
    user.displayName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    user.username.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <main className="min-h-screen bg-background pt-32 pb-24 px-6 md:px-12">
      <Helmet>
        <title>Explore Creators | Portly</title>
        <meta name="description" content="Discover talented designers, photographers, and creatives on Portly." />
      </Helmet>

      <div className="max-w-[1400px] mx-auto">
        <div className="mb-16 text-center max-w-2xl mx-auto">
          <h1 className="font-headline font-extrabold text-5xl md:text-6xl uppercase tracking-tighter text-primary-text mb-6">
            Discover <span className="italic font-light text-accent">Creators</span>
          </h1>
          <p className="text-primary-text/60 font-body text-lg">
            Find and connect with top creative professionals building their portfolios on Portly.
          </p>
          
          <div className="mt-8 relative max-w-md mx-auto">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-primary-text/40">search</span>
            <input 
              type="text" 
              placeholder="Search by name or username..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-full py-4 pl-12 pr-6 text-primary-text font-body focus:outline-none focus:border-accent/50 transition-colors"
            />
          </div>
        </div>

        {filteredCreators.length > 0 ? (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6 mb-12">
              {filteredCreators.map((user, i) => (
                <motion.div
                  key={user.uid}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: (i % 20) * 0.05 }}
                >
                  <Link
                    to={`/u/${user.username}`}
                    className="flex flex-col items-center gap-4 p-6 bg-card-bg/50 border border-white/5 rounded-2xl hover:bg-white/5 hover:border-accent/30 transition-all group h-full"
                  >
                    <div className="w-24 h-24 rounded-full bg-white/5 overflow-hidden border border-white/10 group-hover:border-accent/50 transition-colors">
                      {user.photoURL ? (
                        <img src={user.photoURL} alt={user.displayName} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="material-symbols-outlined text-4xl text-white/20">person</span>
                        </div>
                      )}
                    </div>
                    <div className="text-center w-full">
                      <span className="font-headline font-bold text-sm uppercase tracking-wide text-primary-text block truncate">{user.displayName}</span>
                      <span className="font-label text-[10px] uppercase tracking-wider text-accent/60 truncate block mt-1">@{user.username}</span>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>

            {hasMore && !searchTerm && (
              <div className="flex justify-center mt-12">
                <button
                  onClick={() => loadCreators(true)}
                  disabled={loading}
                  className="px-8 py-3 rounded-full border border-white/10 text-primary-text font-headline text-xs tracking-widest uppercase hover:bg-white/5 transition-all disabled:opacity-50"
                >
                  {loading ? 'Loading...' : 'Load More'}
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-20 text-primary-text/40 font-body">
            No creators found matching "{searchTerm}".
          </div>
        )}
      </div>
    </main>
  )
}
