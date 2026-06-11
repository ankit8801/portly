import { Link } from 'react-router-dom'
import { motion, useMotionValue, useSpring } from 'framer-motion'
import { Helmet } from 'react-helmet-async'
import React, { useState, useEffect, useRef } from 'react'
import { getPublishedProjectsPage } from '../supabase/services/projectService'
import { getUsersPage } from '../supabase/services/userService'

export default function Home() {
  const customEase = [0.16, 1, 0.3, 1]
  const [allProjects, setAllProjects] = useState([])
  const [creators, setCreators] = useState([])
  const heroRef = useRef(null)

  // Mouse-follow glow
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  const glowX = useSpring(mouseX, { stiffness: 80, damping: 20 })
  const glowY = useSpring(mouseY, { stiffness: 80, damping: 20 })

  useEffect(() => {
    const handleMouse = (e) => {
      mouseX.set(e.clientX - 200)
      mouseY.set(e.clientY - 200)
    }
    window.addEventListener('mousemove', handleMouse)
    return () => window.removeEventListener('mousemove', handleMouse)
  }, [mouseX, mouseY])

  useEffect(() => {
    const loadGlobalData = async () => {
      try {
        const [projectsRes, usersRes] = await Promise.all([
          getPublishedProjectsPage(null, 10),
          getUsersPage(null, 10)
        ])
        const projects = projectsRes.projects
        const users = usersRes.users
        
        // Map user details to projects
        const userMap = {}
        users.forEach(u => userMap[u.uid] = u)
        
        const enrichedProjects = projects.map(p => ({
          ...p,
          creator: userMap[p.ownerId] || null,
          customUrl: userMap[p.ownerId] ? `/u/${userMap[p.ownerId].username}/${p.slug}` : `/projects/${p.id}`
        })).filter(p => p.creator) // only show if we have creator info

        setCreators(users)
        setAllProjects(enrichedProjects)
      } catch (err) {
        console.error("Error loading home data:", err)
      }
    }
    loadGlobalData()
  }, [])

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.12, delayChildren: 0.2 } }
  }
  const itemVariants = {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.9, ease: customEase } }
  }

  return (
    <main className="relative overflow-hidden bg-background min-h-screen">
      <Helmet>
        <title>Portly | Multi-User Designer Portfolios</title>
        <meta name="description" content="A platform for designers to build their portfolio websites instantly." />
      </Helmet>

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section ref={heroRef} className="relative min-h-[90vh] flex items-center justify-center overflow-hidden pt-20">
        <div className="absolute inset-0 -z-10 bg-background">
          <div className="absolute top-0 right-0 w-[50%] h-full bg-gradient-to-bl from-section-tone to-transparent opacity-60" />
          <div className="absolute bottom-0 left-0 w-[40%] h-[60%] bg-gradient-to-tr from-accent/10 to-transparent" />
          <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-[120px]" />
          <div className="grid-bg absolute inset-0 opacity-20" />
        </div>

        {/* Mouse-follow glow */}
        <motion.div
          className="pointer-events-none fixed w-[400px] h-[400px] rounded-full -z-10"
          style={{
            x: glowX,
            y: glowY,
            background: 'radial-gradient(circle, rgba(200,169,107,0.08) 0%, transparent 70%)',
          }}
        />

        {/* Hero content */}
        <div className="max-w-[1400px] mx-auto w-full px-6 md:px-12 py-24 flex flex-col items-center text-center">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="flex flex-col items-center z-10 max-w-4xl"
          >
            <motion.div variants={itemVariants} className="flex items-center gap-3 mb-8">
              <span className="font-label text-[10px] tracking-[0.4em] uppercase text-accent border border-accent/20 px-6 py-2 rounded-full bg-accent/5">
                Join the network
              </span>
            </motion.div>

            <motion.h1
              variants={itemVariants}
              className="font-headline font-extrabold text-5xl md:text-[8vw] lg:text-[100px] leading-[0.85] tracking-tight uppercase text-primary-text mb-8"
            >
              Build Your<br />
              <span className="text-accent italic font-light">Portfolio</span><br />
              In Minutes.
            </motion.h1>

            <motion.p variants={itemVariants} className="font-body text-lg md:text-xl text-primary-text/60 max-w-2xl leading-relaxed mb-12">
              The premier platform for designers, photographers, and creatives to showcase their work, without writing a single line of code.
            </motion.p>

            <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center gap-4">
              <Link
                to="/signup"
                className="group flex items-center gap-3 bg-accent text-on-accent px-10 py-5 rounded-full font-headline font-bold uppercase tracking-[0.1em] shadow-2xl hover:scale-105 hover:shadow-[0_0_30px_rgba(200,169,107,0.4)] transition-all duration-300"
              >
                Start For Free
                <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── EXPLORE CREATORS ────────────────────────────────────────────── */}
      {creators.length > 0 && (
        <section className="py-24 px-6 md:px-12 bg-section-tone border-t border-white/5">
          <div className="max-w-[1400px] mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, ease: customEase }}
              className="mb-16 text-center"
            >
              <span className="font-label text-[10px] tracking-[0.4em] uppercase text-accent mb-4 block">Network</span>
              <h2 className="font-headline font-extrabold text-4xl md:text-5xl uppercase tracking-tighter text-primary-text mb-4">
                Explore <span className="italic font-light opacity-70">Creators</span>
              </h2>
              <Link to="/explore-creators" className="inline-flex items-center gap-2 text-accent hover:brightness-125 font-headline text-sm font-bold uppercase tracking-widest transition-all">
                View Directory <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </Link>
            </motion.div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
              {creators.slice(0, 6).map((user, i) => (
                <motion.div
                  key={user.uid}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.05, ease: customEase }}
                >
                  <Link
                    to={`/u/${user.username}`}
                    className="flex flex-col items-center gap-4 p-6 bg-card-bg/50 border border-white/5 rounded-2xl hover:bg-white/5 hover:border-accent/30 transition-all group"
                  >
                    <div className="w-20 h-20 rounded-full bg-white/5 overflow-hidden border border-white/10 group-hover:border-accent/50 transition-colors">
                      {user.photoURL ? (
                        <img src={user.photoURL} alt={user.displayName} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="material-symbols-outlined text-3xl text-white/20">person</span>
                        </div>
                      )}
                    </div>
                    <div className="text-center w-full">
                      <span className="font-headline font-bold text-sm uppercase tracking-wide text-primary-text block truncate">{user.displayName}</span>
                      <span className="font-label text-[9px] uppercase tracking-wider text-accent/60 truncate block mt-1">@{user.username}</span>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── EXPLORE PROJECTS ────────────────────────────────────────────── */}
      {allProjects.length > 0 && (
        <section className="py-32 px-6 md:px-12 bg-background border-t border-white/5">
          <div className="max-w-[1400px] mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, ease: customEase }}
              className="mb-16 text-center"
            >
              <span className="font-label text-[10px] tracking-[0.4em] uppercase text-accent mb-4 block">Inspiration</span>
              <h2 className="font-headline font-extrabold text-4xl md:text-5xl uppercase tracking-tighter text-primary-text mb-4">
                Featured <span className="italic font-light opacity-70">Projects</span>
              </h2>
              <Link to="/explore-projects" className="inline-flex items-center gap-2 text-accent hover:brightness-125 font-headline text-sm font-bold uppercase tracking-widest transition-all">
                Browse All <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </Link>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {allProjects.slice(0, 8).map((project, i) => (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.7, delay: i * 0.1, ease: customEase }}
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
                              <img src={project.creator.photoURL} className="w-4 h-4 rounded-full" alt="Creator" />
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
          </div>
        </section>
      )}

      {/* ── CTA BANNER ────────────────────────────────────────────────────── */}
      <section className="py-32 px-6 md:px-12 bg-section-tone border-t border-white/5">
        <div className="max-w-[1400px] mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1, ease: customEase }}
          >
            <span className="font-label text-[10px] tracking-[0.4em] uppercase text-accent mb-6 block">Ready to join?</span>
            <h2 className="font-headline font-extrabold text-[8vw] md:text-[5vw] lg:text-[72px] uppercase tracking-tighter text-primary-text leading-[0.9] mb-12">
              Start Building<br /><span className="text-accent italic font-light">Your Portfolio</span>
            </h2>
            <Link
              to="/signup"
              className="group inline-flex items-center gap-4 bg-accent text-on-accent px-12 py-5 rounded-full font-headline font-bold uppercase tracking-[0.15em] shadow-2xl hover:scale-105 hover:shadow-[0_0_40px_rgba(200,169,107,0.4)] transition-all duration-300"
            >
              Sign Up Free
              <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
            </Link>
          </motion.div>
        </div>
      </section>
    </main>
  )
}
