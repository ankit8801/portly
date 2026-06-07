import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { motion } from 'framer-motion'
import { getPublishedProjectsPage } from '../firebase/services/projectService'
import { getUserProfile } from '../firebase/services/userService'

export default function ExploreProjects() {
  const [projects, setProjects] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [lastDoc, setLastDoc] = useState(null)
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(false)
  const [userCache, setUserCache] = useState({})

  const loadProjects = async (isNextPage = false) => {
    if (loading) return
    setLoading(true)
    try {
      const res = await getPublishedProjectsPage(isNextPage ? lastDoc : null, 20)
      
      // Fetch missing user profiles
      const newOwnerIds = [...new Set(res.projects.map(p => p.ownerId))].filter(id => !userCache[id])
      const fetchedUsers = {}
      if (newOwnerIds.length > 0) {
        await Promise.all(
          newOwnerIds.map(async (id) => {
            const profile = await getUserProfile(id)
            if (profile) fetchedUsers[id] = profile
          })
        )
      }

      const updatedCache = { ...userCache, ...fetchedUsers }
      setUserCache(updatedCache)

      const enriched = res.projects.map(p => ({
        ...p,
        creator: updatedCache[p.ownerId] || null,
        customUrl: updatedCache[p.ownerId] ? `/u/${updatedCache[p.ownerId].username}/${p.slug}` : `/projects/${p.id}`
      })).filter(p => p.creator)

      if (isNextPage) {
        setProjects(prev => [...prev, ...enriched])
      } else {
        setProjects(enriched)
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
    loadProjects()
  }, [])

  const filteredProjects = projects.filter(p => 
    p.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.category.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <main className="min-h-screen bg-background pt-32 pb-24 px-6 md:px-12">
      <Helmet>
        <title>Explore Projects | Portly</title>
        <meta name="description" content="Discover inspiring projects built by creators on Portly." />
      </Helmet>

      <div className="max-w-[1400px] mx-auto">
        <div className="mb-16 text-center max-w-2xl mx-auto">
          <h1 className="font-headline font-extrabold text-5xl md:text-6xl uppercase tracking-tighter text-primary-text mb-6">
            Inspiring <span className="italic font-light text-accent">Projects</span>
          </h1>
          <p className="text-primary-text/60 font-body text-lg">
            Browse through hundreds of creative case studies published on our platform.
          </p>
          
          <div className="mt-8 relative max-w-md mx-auto">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-primary-text/40">search</span>
            <input 
              type="text" 
              placeholder="Search by title or category..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-full py-4 pl-12 pr-6 text-primary-text font-body focus:outline-none focus:border-accent/50 transition-colors"
            />
          </div>
        </div>

        {filteredProjects.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 mb-12">
              {filteredProjects.map((project, i) => (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: (i % 20) * 0.05 }}
                >
                  <Link
                    to={project.customUrl}
                    className="block group relative aspect-[4/5] rounded-2xl overflow-hidden bg-card-bg border border-white/5 shadow-xl"
                  >
                    {project.thumbnail ? (
                      <img src={project.thumbnail} alt={project.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" loading="lazy" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-card-bg to-surface-high flex items-center justify-center">
                        <span className="material-symbols-outlined text-4xl text-accent/20">palette</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent opacity-80 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="absolute inset-0 p-6 flex flex-col justify-between">
                      <div className="flex justify-between items-start">
                        <span className="category-pill">{project.category}</span>
                        {project.creator && (
                          <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
                            {project.creator.photoURL ? (
                              <img src={project.creator.photoURL} className="w-4 h-4 rounded-full object-cover" alt="Creator" />
                            ) : (
                              <span className="material-symbols-outlined text-[12px] text-white/50">person</span>
                            )}
                            <span className="font-label text-[9px] uppercase tracking-wider text-white/80">{project.creator.username}</span>
                          </div>
                        )}
                      </div>
                      <div className="translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                        <h3 className="font-headline font-bold text-xl text-white uppercase tracking-wider mb-2">{project.title}</h3>
                        <div className="flex items-center gap-2 text-white/50 group-hover:text-accent">
                          <span className="font-label text-[9px] uppercase tracking-wider">View Case Study</span>
                          <span className="material-symbols-outlined text-[12px]">arrow_forward</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>

            {hasMore && !searchTerm && (
              <div className="flex justify-center mt-12">
                <button
                  onClick={() => loadProjects(true)}
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
            No projects found matching "{searchTerm}".
          </div>
        )}
      </div>
    </main>
  )
}
