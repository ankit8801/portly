import React, { useState, useEffect } from 'react'
import { fetchUserProjects, deleteProject } from '../../firebase/services/projectService'
import { useAuth } from '../../context/AuthContext'
import ProjectModal from '../../components/ProjectModal'
import { toast } from 'react-hot-toast'

export default function ProjectsTab() {
  const { user, profile } = useAuth()
  const [projects, setProjects] = useState([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editProjectData, setEditProjectData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [projectToDelete, setProjectToDelete] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    if (user?.uid) {
      fetchUserProjects(user.uid)
        .then(data => setProjects(data || []))
        .catch(err => console.error("Error loading projects", err))
        .finally(() => setLoading(false))
    }
  }, [user])

  const handleProjectSuccess = async () => {
    try {
      const data = await fetchUserProjects(user.uid)
      setProjects(data)
    } catch (err) {
      console.error("Failed to reload projects", err)
    }
  }

  const confirmDeleteProject = async () => {
    if (!projectToDelete) return
    setIsDeleting(true)
    const tid = toast.loading('Deleting project...')
    try {
      await deleteProject(projectToDelete)
      const data = await fetchUserProjects(user.uid)
      setProjects(data)
      toast.success('Project deleted', { id: tid })
    } catch (err) {
      toast.error("Failed to delete: " + err.message, { id: tid })
    } finally {
      setIsDeleting(false)
      setProjectToDelete(null)
    }
  }

  const handleDeleteClick = (id, e) => {
    e.stopPropagation()
    setProjectToDelete(id)
  }

  const handleEditProject = (project, e) => {
    if(e) e.stopPropagation()
    setEditProjectData(project)
    setIsModalOpen(true)
  }

  if (loading) {
    return <div className="text-primary-text/40 font-body">Loading projects...</div>
  }

  return (
    <>
      <ProjectModal 
        isOpen={isModalOpen} 
        onClose={() => { setIsModalOpen(false); setEditProjectData(null); }} 
        onSuccess={handleProjectSuccess} 
        initialData={editProjectData}
      />

      {/* Delete Confirmation Modal */}
      {projectToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-card-bg border border-white/10 rounded-2xl p-8 max-w-sm w-full shadow-2xl">
            <h3 className="text-white font-headline font-bold text-xl mb-4">Delete Project?</h3>
            <p className="text-white/60 mb-8 font-body text-sm">Are you sure you want to delete this project? This action cannot be undone.</p>
            <div className="flex gap-4">
              <button 
                onClick={() => setProjectToDelete(null)}
                disabled={isDeleting}
                className="flex-1 px-4 py-3 border border-white/10 rounded-xl text-white hover:bg-white/5 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button 
                onClick={confirmDeleteProject}
                disabled={isDeleting}
                className="flex-1 px-4 py-3 bg-red-500/20 text-red-500 rounded-xl hover:bg-red-500/30 transition-colors disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-16">
        <div>
          <span className="font-label text-[10px] tracking-[0.3em] uppercase text-accent mb-4 block">Dashboard</span>
          <h1 className="font-headline font-extrabold text-3xl md:text-6xl tracking-tighter text-primary-text uppercase">Your <span className="italic font-light">Projects</span></h1>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="w-full md:w-auto bg-accent text-on-accent px-8 py-4 rounded-full font-headline font-bold text-xs uppercase tracking-widest shadow-xl hover:scale-105 transition-all flex items-center justify-center gap-2">
          <span className="material-symbols-outlined text-sm">add</span> New Project
        </button>
      </div>

      <div className="bg-card-bg/30 border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left font-body min-w-[800px] md:min-w-0">
          <thead className="bg-white/5">
            <tr>
              <th className="p-6 font-label text-[10px] tracking-[0.2em] uppercase text-primary-text/40">Project Title</th>
              <th className="p-6 font-label text-[10px] tracking-[0.2em] uppercase text-primary-text/40">Category</th>
              <th className="p-6 font-label text-[10px] tracking-[0.2em] uppercase text-primary-text/40 text-right">Visibility</th>
              <th className="p-6 font-label text-[10px] tracking-[0.2em] uppercase text-primary-text/40 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-primary-text/80">
            {projects.map((row) => (
              <tr key={row.id} className="hover:bg-white/5 transition-colors group">
                <td className="p-6 flex items-center gap-4 cursor-pointer" onClick={(e) => handleEditProject(row, e)}>
                  <div className="w-12 h-12 bg-white/5 rounded-lg overflow-hidden shrink-0 flex items-center justify-center">
                    {row.thumbnail ? <img src={row.thumbnail} className="w-full h-full object-cover" /> : <span className="material-symbols-outlined text-white/20">palette</span>}
                  </div>
                  <div>
                    <span className="font-headline text-xs font-bold uppercase tracking-wider block">{row.title}</span>
                    <span className="text-[10px] text-foreground/40">{row.slug}</span>
                  </div>
                </td>
                <td className="p-6 text-sm">{row.category || 'Design'}</td>
                <td className="p-6 text-right">
                  <span className={`text-[8px] font-bold uppercase tracking-[0.2em] px-3 py-1.5 rounded-full border ${row.status === 'published' ? 'border-accent/30 text-accent bg-accent/5' : 'border-white/20 text-foreground/60 bg-white/5'}`}>
                    {row.status}
                  </span>
                </td>
                <td className="p-6 text-right flex justify-end gap-2 items-center">
                  <a href={`/u/${profile?.username}/${row.slug}`} target="_blank" rel="noopener noreferrer" className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-primary-text/60 hover:text-white transition-colors flex items-center justify-center" title="View Project">
                    <span className="material-symbols-outlined text-[16px]">visibility</span>
                  </a>
                  <button onClick={(e) => handleEditProject(row, e)} className="p-2 bg-white/5 hover:bg-accent/20 rounded-lg text-primary-text/60 hover:text-accent transition-colors flex items-center justify-center" title="Edit Project">
                    <span className="material-symbols-outlined text-[16px]">edit</span>
                  </button>
                  <button onClick={(e) => handleDeleteClick(row.id, e)} className="p-2 bg-white/5 hover:bg-red-500/20 rounded-lg text-primary-text/60 hover:text-red-400 transition-colors flex items-center justify-center" title="Delete Project">
                    <span className="material-symbols-outlined text-[16px]">delete</span>
                  </button>
                </td>
              </tr>
            ))}
            {projects.length === 0 && (
              <tr>
                <td colSpan="4" className="p-8 text-center text-primary-text/40 text-sm">
                  You haven't created any projects yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        </div>
      </div>
    </>
  )
}
