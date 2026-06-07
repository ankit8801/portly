import React, { useState, useEffect } from 'react'
import { getPortfolioSettings, updatePortfolioSettings } from '../../firebase/services/userService'
import { uploadFile } from '../../firebase/services/storageService'
import { useAuth } from '../../context/AuthContext'
import ImageCropModal from '../../components/ImageCropModal'

import { toast } from 'react-hot-toast'

export default function PortfolioTab() {
  const { user } = useAuth()
  const [settings, setSettings] = useState({})
  const [loading, setLoading] = useState(true)
  
  const [uploadingSlot, setUploadingSlot] = useState(null)
  const [cropImage, setCropImage] = useState(null)
  const [isCropModalOpen, setIsCropModalOpen] = useState(false)

  useEffect(() => {
    if (user?.uid) {
      getPortfolioSettings(user.uid)
        .then(data => setSettings(data || {}))
        .catch(err => console.error(err))
        .finally(() => setLoading(false))
    }
  }, [user])

  const handleImageUpdate = (slot, e) => {
    const file = e.target.files[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      setCropImage(reader.result)
      setUploadingSlot(slot)
      setIsCropModalOpen(true)
    }
    reader.readAsDataURL(file)
  }

  const handleCropSave = async (blob) => {
    if (!uploadingSlot) return;
    if (!blob) return;

    setIsCropModalOpen(false);

    try {
      const imageUrl = await uploadFile(blob, `users/${user.uid}/portfolio/${uploadingSlot}_${Date.now()}`);
      await updatePortfolioSettings(user.uid, { [uploadingSlot]: imageUrl });
      setSettings(prev => ({ ...prev, [uploadingSlot]: imageUrl }));
      toast.success('Image updated successfully!');
    } catch (err) {
      console.error("Content Upload Error:", err);
      toast.error('Failed to update image: ' + (err.message || 'Unknown error'));
    } finally {
      setUploadingSlot(null);
      setCropImage(null);
    }
  };

  const handleSettingsUpdate = async (e) => {
    e.preventDefault();
    try {
      await updatePortfolioSettings(user.uid, settings);
      toast.success('Settings saved successfully!');
    } catch (err) {
      toast.error('Failed to save settings.');
    }
  };

  if (loading) {
    return <div className="text-primary-text/40 font-body">Loading settings...</div>
  }

  return (
    <>
      <ImageCropModal 
        isOpen={isCropModalOpen}
        image={cropImage}
        onCancel={() => { setIsCropModalOpen(false); setUploadingSlot(null); setCropImage(null); }}
        onCropComplete={handleCropSave}
      />

      <div className="space-y-16">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div>
            <span className="font-label text-[10px] tracking-[0.3em] uppercase text-accent mb-4 block">Dashboard</span>
            <h1 className="font-headline font-extrabold text-3xl md:text-6xl tracking-tighter text-primary-text uppercase">Portfolio <span className="italic font-light">Settings</span></h1>
          </div>
        </div>

        <form onSubmit={handleSettingsUpdate} className="space-y-8">
          <div className="bg-card-bg/30 border border-white/5 p-8 rounded-3xl space-y-8">
            <h3 className="font-headline font-bold text-lg uppercase tracking-wider text-primary-text">General Settings</h3>
            
            <div className="space-y-2">
              <label className="font-label text-[10px] tracking-[0.2em] uppercase text-primary-text/40 ml-1">Website Title</label>
              <input type="text" value={settings.websiteTitle || ''} onChange={e => setSettings(s => ({...s, websiteTitle: e.target.value}))}
                className="w-full bg-background/50 border border-white/10 rounded-xl p-4 font-body text-primary-text focus:border-accent focus:outline-none transition-colors" />
            </div>

            <div className="space-y-2">
              <label className="font-label text-[10px] tracking-[0.2em] uppercase text-primary-text/40 ml-1">SEO Description</label>
              <textarea rows="3" value={settings.seoDescription || ''} onChange={e => setSettings(s => ({...s, seoDescription: e.target.value}))}
                className="w-full bg-background/50 border border-white/10 rounded-xl p-4 font-body text-primary-text focus:border-accent focus:outline-none transition-colors resize-none" />
            </div>
            
            <div className="space-y-2">
              <label className="font-label text-[10px] tracking-[0.2em] uppercase text-primary-text/40 ml-1">Hero Background Image</label>
              <div className="flex items-center gap-4">
                {settings.homeHero && <img src={settings.homeHero} alt="Hero" className="w-20 h-20 rounded-xl object-cover border border-white/10" />}
                <input type="file" accept="image/*" onChange={(e) => handleImageUpdate('homeHero', e)} className="text-sm text-primary-text/60 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-headline file:font-bold file:uppercase file:tracking-widest file:bg-accent/10 file:text-accent hover:file:bg-accent/20 transition-colors" />
              </div>
            </div>
          </div>

          <div className="bg-card-bg/30 border border-white/5 p-8 rounded-3xl space-y-8">
            <h3 className="font-headline font-bold text-lg uppercase tracking-wider text-primary-text">Social Links</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="font-label text-[10px] tracking-[0.2em] uppercase text-primary-text/40 ml-1">Instagram URL</label>
                <input type="url" value={settings.instagram || ''} onChange={e => setSettings(s => ({...s, instagram: e.target.value}))}
                  className="w-full bg-background/50 border border-white/10 rounded-xl p-4 font-body text-primary-text focus:border-accent focus:outline-none transition-colors" />
              </div>
              <div className="space-y-2">
                <label className="font-label text-[10px] tracking-[0.2em] uppercase text-primary-text/40 ml-1">LinkedIn URL</label>
                <input type="url" value={settings.linkedin || ''} onChange={e => setSettings(s => ({...s, linkedin: e.target.value}))}
                  className="w-full bg-background/50 border border-white/10 rounded-xl p-4 font-body text-primary-text focus:border-accent focus:outline-none transition-colors" />
              </div>
              <div className="space-y-2">
                <label className="font-label text-[10px] tracking-[0.2em] uppercase text-primary-text/40 ml-1">Behance URL</label>
                <input type="url" value={settings.behance || ''} onChange={e => setSettings(s => ({...s, behance: e.target.value}))}
                  className="w-full bg-background/50 border border-white/10 rounded-xl p-4 font-body text-primary-text focus:border-accent focus:outline-none transition-colors" />
              </div>
              <div className="space-y-2">
                <label className="font-label text-[10px] tracking-[0.2em] uppercase text-primary-text/40 ml-1">Dribbble URL</label>
                <input type="url" value={settings.dribbble || ''} onChange={e => setSettings(s => ({...s, dribbble: e.target.value}))}
                  className="w-full bg-background/50 border border-white/10 rounded-xl p-4 font-body text-primary-text focus:border-accent focus:outline-none transition-colors" />
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button type="submit"
              className="bg-accent text-on-accent px-8 py-4 rounded-full font-headline font-bold text-xs uppercase tracking-widest shadow-xl hover:scale-105 active:scale-95 transition-all">
              Save Settings
            </button>
          </div>
        </form>
      </div>
    </>
  )
}
