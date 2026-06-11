import React, { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { toast } from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
import { fetchUserProjects, deleteProject } from '../../supabase/services/projectService'
import { deleteUserDocs } from '../../supabase/services/userService'
import { deleteUserAccount } from '../../supabase/services/authService'

export default function SettingsTab() {
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const [showConfirm, setShowConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleConfirmDelete = async () => {
    if (!user) return
    setIsDeleting(true)
    const tid = toast.loading('Deleting account and all data...')
    try {
      // 1. Delete all user projects (which cascades to blocks and storage)
      const projects = await fetchUserProjects(user.uid)
      for (const p of projects) {
        await deleteProject(p.id)
      }

      // 2 & 3. Delete user doc & portfolio settings (and username implicitly since it's in users table)
      await deleteUserDocs(user.uid)

      // 4. Delete Auth user / Sign out
      await deleteUserAccount()

      toast.success('Account deleted successfully', { id: tid })
      navigate('/')
    } catch (err) {
      console.error(err)
      if (err.code === 'auth/requires-recent-login') {
        toast.error('Please log out and log back in to delete your account.', { id: tid })
      } else {
        toast.error('Failed to delete account: ' + err.message, { id: tid })
      }
    } finally {
      setIsDeleting(false)
      setShowConfirm(false)
    }
  }

  return (
    <div className="space-y-16">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <span className="font-label text-[10px] tracking-[0.3em] uppercase text-accent mb-4 block">Dashboard</span>
          <h1 className="font-headline font-extrabold text-3xl md:text-6xl tracking-tighter text-primary-text uppercase">Account <span className="italic font-light">Settings</span></h1>
        </div>
      </div>

      <div className="bg-card-bg/30 border border-white/5 p-8 rounded-3xl space-y-8">
        <h3 className="font-headline font-bold text-lg uppercase tracking-wider text-primary-text">Profile Information</h3>
        
        <div className="space-y-6 max-w-lg">
          <div>
            <label className="font-label text-[10px] tracking-[0.2em] uppercase text-primary-text/40 ml-1">Email Address</label>
            <input type="text" value={user?.email || ''} readOnly disabled
              className="w-full mt-2 bg-background/20 border border-white/5 rounded-xl p-4 font-body text-primary-text/60 cursor-not-allowed" />
          </div>
          <div>
            <label className="font-label text-[10px] tracking-[0.2em] uppercase text-primary-text/40 ml-1">Username</label>
            <input type="text" value={profile?.username || ''} readOnly disabled
              className="w-full mt-2 bg-background/20 border border-white/5 rounded-xl p-4 font-body text-primary-text/60 cursor-not-allowed" />
            <p className="text-[10px] text-primary-text/40 mt-2 ml-1">Usernames cannot be changed once set.</p>
          </div>
        </div>
      </div>
      
      <div className="bg-card-bg/30 border border-white/5 p-8 rounded-3xl space-y-8">
        <h3 className="font-headline font-bold text-lg uppercase tracking-wider text-red-400">Danger Zone</h3>
        <p className="text-primary-text/60 font-body text-sm max-w-md">
          Once you delete your account, there is no going back. Please be certain.
        </p>
        <button 
          onClick={() => setShowConfirm(true)}
          className="bg-red-500/10 text-red-400 border border-red-500/20 px-8 py-4 rounded-full font-headline font-bold text-xs uppercase tracking-widest hover:bg-red-500/20 transition-all"
        >
          Delete Account
        </button>
      </div>

      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md">
          <div className="bg-surface border border-white/10 p-8 rounded-3xl max-w-md w-full shadow-2xl">
            <h3 className="font-headline font-bold text-2xl text-primary-text uppercase tracking-tight mb-4">Are you sure?</h3>
            <p className="text-primary-text/60 font-body mb-8">
              This action cannot be undone. This will permanently delete your account, portfolio, and all your projects.
            </p>
            <div className="flex gap-4">
              <button 
                onClick={() => setShowConfirm(false)}
                disabled={isDeleting}
                className="flex-1 px-6 py-3 rounded-full border border-white/10 text-primary-text font-headline text-xs tracking-widest uppercase hover:bg-white/5 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button 
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="flex-1 px-6 py-3 rounded-full bg-red-500/20 border border-red-500/30 text-red-400 font-headline text-xs tracking-widest uppercase hover:bg-red-500/30 transition-colors disabled:opacity-50 flex justify-center items-center gap-2"
              >
                {isDeleting ? (
                  <div className="w-4 h-4 border-2 border-red-400/20 border-t-red-400 rounded-full animate-spin" />
                ) : 'Delete Forever'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
