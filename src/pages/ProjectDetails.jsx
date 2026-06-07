import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Helmet } from 'react-helmet-async'
import { getUserByUsername } from '../firebase/services/userService'
import { getProjectBySlug, getUserPublishedProjectsPage } from '../firebase/services/projectService'
import InteractiveBentoGallery from '../components/blocks/interactive-bento-gallery'

// ── Block renderers ────────────────────────────────────────────────────────────

function TextBlock({ block }) {
  return (
    <div className="max-w-3xl mx-auto">
      <p className="font-body text-xl md:text-2xl text-primary-text/80 leading-relaxed whitespace-pre-line">
        {block.content}
      </p>
    </div>
  )
}

function ImageBlock({ block }) {
  return (
    <div className="max-w-5xl mx-auto">
      <figure>
        <div className="w-full rounded-2xl overflow-hidden shadow-2xl">
          <img
            src={block.url}
            alt={block.caption || 'Project image'}
            className="w-full h-auto object-cover"
            loading="lazy"
          />
        </div>
        {block.caption && (
          <figcaption className="mt-4 text-center font-label text-[10px] uppercase tracking-[0.25em] text-primary-text/30">
            {block.caption}
          </figcaption>
        )}
      </figure>
    </div>
  )
}

const GALLERY_SPANS = [
  'md:col-span-1 md:row-span-3 sm:col-span-1 sm:row-span-2',
  'md:col-span-2 md:row-span-2 col-span-1 sm:col-span-2 sm:row-span-2',
  'md:col-span-1 md:row-span-3 sm:col-span-2 sm:row-span-2',
  'md:col-span-2 md:row-span-2 sm:col-span-1 sm:row-span-2',
  'md:col-span-1 md:row-span-3 sm:col-span-1 sm:row-span-2',
  'md:col-span-2 md:row-span-2 sm:col-span-1 sm:row-span-2',
]

function PhotoGridBlock({ block }) {
  if (!block.images?.length) return null
  if (block.images.length === 1) return <ImageBlock block={{ url: block.images[0].url, caption: block.images[0].caption }} />

  const mediaItems = block.images.map((img, i) => ({
    id: i + 1,
    type: 'image',
    title: img.caption || `View ${i + 1}`,
    desc: img.caption || '',
    url: img.url,
    span: GALLERY_SPANS[i % GALLERY_SPANS.length],
  }))

  return (
    <div className="max-w-7xl mx-auto -mx-6 md:-mx-12">
      <InteractiveBentoGallery
        title=""
        description=""
        mediaItems={mediaItems}
      />
    </div>
  )
}

function VideoBlock({ block }) {
  return (
    <div className="max-w-5xl mx-auto">
      <figure>
        <div className="w-full aspect-video rounded-2xl overflow-hidden shadow-2xl bg-surface-lowest">
          <iframe
            src={block.url}
            title={block.caption || 'Video'}
            className="w-full h-full border-none"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            loading="lazy"
          />
        </div>
        {block.caption && (
          <figcaption className="mt-4 text-center font-label text-[10px] uppercase tracking-[0.25em] text-primary-text/30">
            {block.caption}
          </figcaption>
        )}
      </figure>
    </div>
  )
}

function EmbedBlock({ block }) {
  return (
    <div className="max-w-5xl mx-auto">
      <figure>
        <div className="w-full aspect-video rounded-2xl overflow-hidden shadow-2xl bg-surface-lowest border border-white/5">
          <iframe
            src={block.url}
            title={block.caption || 'Embed'}
            className="w-full h-full border-none"
            loading="lazy"
          />
        </div>
        {block.caption && (
          <figcaption className="mt-4 text-center font-label text-[10px] uppercase tracking-[0.25em] text-primary-text/30">
            {block.caption}
          </figcaption>
        )}
      </figure>
    </div>
  )
}

function BlockRenderer({ block }) {
  switch (block.type) {
    case 'text':       return <TextBlock block={block} />
    case 'image':      return <ImageBlock block={block} />
    case 'photo_grid': return <PhotoGridBlock block={block} />
    case 'video':      return <VideoBlock block={block} />
    case 'embed':      return <EmbedBlock block={block} />
    default:           return null
  }
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function ProjectDetails() {
  const { username, slug } = useParams()
  const customEase = [0.16, 1, 0.3, 1]
  const [profile, setProfile] = useState(null)
  const [project, setProject] = useState(null)
  const [nextProject, setNextProject] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const load = async () => {
      try {
        const userProfile = await getUserByUsername(username)
        if (!userProfile) {
          setError('User not found')
          return
        }
        setProfile(userProfile)

        const projectData = await getProjectBySlug(userProfile.uid, slug)
        if (!projectData) {
          setError('Project not found')
          return
        }
        
        // Prevent accessing non-published projects directly via slug URL if not owner
        // Though strictly we should hide it, let's just show it if they have the exact link for now
        // But for portfolio browsing, only published show up.
        setProject(projectData)

        // Fetch adjacent project for "Next Project" strip
        const allRes = await getUserPublishedProjectsPage(userProfile.uid, null, 100)
        const all = allRes.projects || []
        const idx = all.findIndex(p => p.id === projectData.id)
        if (idx !== -1) {
          setNextProject(all[(idx + 1) % all.length] || null)
        } else {
          setNextProject(all[0] || null)
        }
      } catch (err) {
        console.error('Failed to load project', err)
        setError('Failed to load project')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [username, slug])

  if (loading) {
    return (
      <main className="min-h-screen bg-background pt-48 pb-24 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-accent/20 border-t-accent rounded-full animate-spin" />
          <span className="font-headline font-bold uppercase tracking-widest text-accent/50 text-xs">Loading…</span>
        </div>
      </main>
    )
  }

  if (error || !project) {
    return (
      <main className="min-h-screen bg-background pt-48 pb-24 px-8 flex flex-col items-center justify-center text-center">
        <span className="material-symbols-outlined text-5xl text-accent/30 mb-6">search_off</span>
        <h1 className="font-headline font-extrabold text-4xl mb-4 text-primary-text uppercase">Not Found</h1>
        <p className="font-body text-primary-text/50 mb-8 max-w-md">{error || "This project doesn't exist."}</p>
        <Link to={profile ? `/u/${username}` : '/'} className="px-8 py-3 rounded-full border border-accent text-accent font-headline text-xs tracking-widest hover:bg-accent hover:text-on-accent transition-all uppercase">
          {profile ? 'Return to Portfolio' : 'Return Home'}
        </Link>
      </main>
    )
  }

  return (
    <main className="bg-background min-h-screen">
      <Helmet>
        <title>{`${project.title} | ${profile?.displayName}`}</title>
        <meta name="description" content={`${project.title} — a ${project.category} project by ${profile?.displayName}.`} />
      </Helmet>

      {/* ── Hero ───────────────────────────────────────────────────────────── */}
      <header className="relative pt-48 pb-24 px-6 md:px-12 overflow-hidden">
        <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row items-end justify-between gap-12">
          <div className="flex-1">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6 }}
              className="flex items-center gap-3 mb-6"
            >
              <Link to={`/u/${username}`} className="font-label text-[9px] uppercase tracking-[0.3em] text-primary-text/30 hover:text-accent transition-colors flex items-center gap-2">
                <span className="material-symbols-outlined text-[14px]">arrow_back</span>
                Portfolio
              </Link>
              <span className="text-primary-text/20">·</span>
              <span className="category-pill">{project.category}</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1, ease: customEase }}
              className="font-headline font-extrabold text-[10vw] md:text-[6vw] leading-[0.88] tracking-tight uppercase mb-6 text-primary-text"
            >
              {project.title.split(' ').map((word, i) => (
                <span key={i}>
                  {i > 0 && <br />}
                  {i === 1 ? <span className="italic font-light opacity-75">{word}</span> : word}
                </span>
              ))}
            </motion.h1>
          </div>

          {/* Scroll indicator */}
          <div className="hidden lg:flex flex-col items-center gap-4 pb-4" aria-hidden="true">
            <span className="vertical-text font-label text-[9px] tracking-[0.3em] uppercase text-accent/30">SCROLL TO EXPLORE</span>
            <div className="w-px h-24 bg-accent/20 relative overflow-hidden">
              <motion.div
                animate={{ y: [0, 96, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                className="absolute top-0 left-0 w-full h-1/2 bg-accent"
              />
            </div>
          </div>
        </div>
      </header>

      {/* ── Cover Image ─────────────────────────────────────────────────────── */}
      {project.thumbnail && (
        <section className="px-0 md:px-8 mb-24">
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: customEase }}
            className="relative w-full aspect-[21/9] md:rounded-2xl overflow-hidden group shadow-2xl"
          >
            <img
              className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-[1.03]"
              src={project.thumbnail}
              alt={`Cover image for ${project.title}`}
              decoding="async"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent" />
          </motion.div>
        </section>
      )}

      {/* ── Content Blocks ───────────────────────────────────────────────────── */}
      {project.blocks && project.blocks.length > 0 && (
        <section className="px-6 md:px-12 space-y-20 mb-24">
          {project.blocks.map((block, idx) => {
            const isWide = block.type === 'photo_grid' || block.type === 'video' || block.type === 'embed'
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.1 }}
                transition={{ duration: 0.8, ease: customEase }}
                className={isWide ? '-mx-6 md:-mx-12' : 'max-w-[1400px] mx-auto'}
              >
                <BlockRenderer block={block} />
              </motion.div>
            )
          })}
        </section>
      )}

      {/* ── Next Project CTA ─────────────────────────────────────────────────── */}
      <section className="py-24 px-6 md:px-12 border-t border-white/5">
        <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <div>
            <span className="font-label text-[10px] uppercase tracking-[0.4em] text-accent/50 mb-2 block">Continue Exploring</span>
            <h2 className="font-headline font-extrabold text-3xl md:text-5xl uppercase tracking-tighter text-primary-text">
              Next Project
            </h2>
          </div>
          {nextProject ? (
            <Link
              to={`/u/${username}/${nextProject.slug}`}
              className="group flex items-center gap-6 bg-card-bg/50 border border-white/5 rounded-2xl p-4 hover:border-accent/20 transition-all duration-400 min-w-[280px]"
              aria-label={`View next project: ${nextProject.title}`}
            >
              {nextProject.thumbnail && (
                <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0">
                  <img src={nextProject.thumbnail} alt={nextProject.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <span className="category-pill text-[8px] mb-2 inline-block">{nextProject.category}</span>
                <p className="font-headline font-bold text-sm uppercase tracking-wide text-primary-text line-clamp-2">{nextProject.title}</p>
              </div>
              <span className="material-symbols-outlined text-accent/30 group-hover:text-accent group-hover:translate-x-1 transition-all shrink-0">arrow_forward</span>
            </Link>
          ) : (
            <Link
              to={`/u/${username}`}
              className="group flex items-center gap-3 font-headline text-[11px] uppercase tracking-[0.2em] text-accent/60 hover:text-accent transition-colors"
              aria-label="View all projects"
            >
              View Portfolio
              <span className="material-symbols-outlined text-[16px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
            </Link>
          )}
        </div>
      </section>
    </main>
  )
}
