import { useState, useEffect, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Helmet } from 'react-helmet-async'
import { getUserByUsername, getPortfolioSettings } from '../supabase/services/userService'
import { getUserPublishedProjectsPage } from '../supabase/services/projectService'
import { CardStack } from '../components/CardStack'

const ALL_LABEL = 'All Work'

export default function Gallery() {
  const { username } = useParams()
  const customEase = [0.16, 1, 0.3, 1]
  
  const [profile, setProfile] = useState(null)
  const [settings, setSettings] = useState(null)
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [activeCategory, setActiveCategory] = useState(ALL_LABEL)
  const [error, setError] = useState(null)
  
  const [lastDoc, setLastDoc] = useState(null)
  const [hasMore, setHasMore] = useState(true)

  const loadMoreProjects = async () => {
    if (loadingMore || !profile || !hasMore) return
    setLoadingMore(true)
    try {
      const res = await getUserPublishedProjectsPage(profile.uid, lastDoc, 20)
      setProjects(prev => [...prev, ...res.projects])
      setLastDoc(res.lastDoc)
      setHasMore(res.hasMore)
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingMore(false)
    }
  }

  useEffect(() => {
    const loadPortfolio = async () => {
      setLoading(true)
      try {
        const userProfile = await getUserByUsername(username)
        if (!userProfile) {
          setError('User not found')
          return
        }
        
        setProfile(userProfile)
        
        const [userSettings, initialProjectsRes] = await Promise.all([
          getPortfolioSettings(userProfile.uid),
          getUserPublishedProjectsPage(userProfile.uid, null, 20)
        ])
        
        setSettings(userSettings)
        setProjects(initialProjectsRes.projects)
        setLastDoc(initialProjectsRes.lastDoc)
        setHasMore(initialProjectsRes.hasMore)
      } catch (err) {
        console.error("Error loading portfolio:", err)
        setError('Failed to load portfolio')
      } finally {
        setLoading(false)
      }
    }

    if (username) {
      loadPortfolio()
    }
  }, [username])

  const categories = useMemo(() => {
    const cats = [...new Set(projects.map(p => p.category).filter(Boolean))]
    return [ALL_LABEL, ...cats]
  }, [projects])

  const filtered = useMemo(() =>
    activeCategory === ALL_LABEL
      ? projects
      : projects.filter(p => p.category === activeCategory),
    [projects, activeCategory]
  )

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-background">
        <div className="w-8 h-8 border-2 border-accent/20 border-t-accent rounded-full animate-spin" />
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-background text-primary-text">
        <h1 className="text-4xl font-headline font-bold mb-4">404</h1>
        <p className="text-primary-text/50">{error || 'Portfolio not found'}</p>
        <Link to="/" className="mt-8 text-accent hover:underline">Back to Home</Link>
      </div>
    )
  }

  return (
    <main className="pt-32 pb-24 px-6 md:px-12 max-w-[1400px] mx-auto bg-background min-h-screen">
      <Helmet>
        <title>{settings?.websiteTitle || profile.displayName} | Portfolio</title>
        <meta name="description" content={settings?.seoDescription || `Portfolio of ${profile.displayName}`} />
      </Helmet>

      {/* Header */}
      <header className="mb-16 md:mb-20 flex flex-col items-center text-center">
        {profile.photoURL && (
          <img src={profile.photoURL} alt={profile.displayName} className="w-24 h-24 rounded-full mb-6 border-2 border-white/10 object-cover" />
        )}
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="font-label text-[10px] uppercase tracking-[0.4em] text-accent mb-4"
        >
          Portfolio / @{profile.username}
        </motion.span>
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: customEase }}
          className="font-headline font-extrabold text-[8vw] md:text-[5vw] leading-[0.9] tracking-tighter uppercase text-primary-text"
        >
          {profile.displayName}
        </motion.h1>
        {profile.bio && (
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.25, ease: customEase }}
            className="mt-6 max-w-xl text-primary-text/50 font-body text-lg leading-relaxed"
          >
            {profile.bio}
          </motion.p>
        )}
        
        {/* Social Links */}
        <div className="flex gap-4 mt-6">
          {settings?.instagram && <a href={settings.instagram} target="_blank" rel="noreferrer" className="text-primary-text/40 hover:text-accent transition-colors">Instagram</a>}
          {settings?.linkedin && <a href={settings.linkedin} target="_blank" rel="noreferrer" className="text-primary-text/40 hover:text-accent transition-colors">LinkedIn</a>}
          {settings?.behance && <a href={settings.behance} target="_blank" rel="noreferrer" className="text-primary-text/40 hover:text-accent transition-colors">Behance</a>}
          {settings?.dribbble && <a href={settings.dribbble} target="_blank" rel="noreferrer" className="text-primary-text/40 hover:text-accent transition-colors">Dribbble</a>}
        </div>
      </header>

      {/* Category Filter Tabs */}
      {categories.length > 1 && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.35, ease: customEase }}
          className="flex flex-wrap gap-2 justify-center mb-16"
          role="tablist"
        >
          {categories.map(cat => (
            <button
              key={cat}
              role="tab"
              aria-selected={activeCategory === cat}
              onClick={() => setActiveCategory(cat)}
              className={`relative px-5 py-2.5 rounded-full font-headline font-bold text-[10px] uppercase tracking-[0.15em] transition-all duration-300 border ${
                activeCategory === cat
                  ? 'bg-accent text-on-accent border-accent shadow-[0_0_20px_rgba(200,169,107,0.3)]'
                  : 'border-white/10 text-primary-text/50 hover:border-white/30 hover:text-primary-text bg-transparent'
              }`}
            >
              {cat}
            </button>
          ))}
        </motion.div>
      )}

      {/* Empty state */}
      {filtered.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-32"
        >
          <span className="material-symbols-outlined text-5xl text-accent/20 mb-4 block">palette</span>
          <p className="font-body text-primary-text/40 text-lg">No projects published yet.</p>
        </motion.div>
      )}

      {/* Projects 3D Card Stack */}
      {filtered.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: customEase }}
          className="relative w-full py-12 flex flex-col items-center justify-center overflow-visible"
        >
          <CardStack 
            items={filtered.map(p => ({
              ...p,
              // Inject the custom route path for CardStack to link to
              customUrl: `/u/${profile.username}/${p.slug}`
            }))} 
            maxVisible={7}
            cardWidth={520}
            cardHeight={360}
            loop={true}
          />
          
          {hasMore && (
            <div className="mt-16 flex justify-center w-full z-10 relative">
              <button
                onClick={loadMoreProjects}
                disabled={loadingMore}
                className="px-8 py-3 rounded-full border border-white/10 text-primary-text font-headline text-xs tracking-widest uppercase hover:bg-white/5 transition-all disabled:opacity-50"
              >
                {loadingMore ? 'Loading...' : 'Load More Work'}
              </button>
            </div>
          )}
        </motion.div>
      )}
    </main>
  )
}
