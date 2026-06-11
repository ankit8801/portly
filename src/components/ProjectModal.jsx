import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createProject, updateProject } from '../supabase/services/projectService';
import { uploadFile } from '../supabase/services/storageService';
import { useAuth } from '../context/AuthContext';
import ImageCropModal from './ImageCropModal';
import { compressImage } from '../utils/cropImage';

const CATEGORIES = [
  'Brand Identity',
  'Packaging',
  'UI Design',
  'Logo Design',
  'Social Media',
  'Motion Design',
  'Illustration',
  'Print Design',
  'Other',
];

const BLOCK_TYPES = [
  { type: 'text',       icon: 'text_fields',    label: 'Text Block' },
  { type: 'image',      icon: 'image',           label: 'Single Image' },
  { type: 'photo_grid', icon: 'grid_view',       label: 'Photo Grid' },
  { type: 'video',      icon: 'play_circle',     label: 'Video Embed' },
  { type: 'embed',      icon: 'code',            label: 'Embed / Iframe' },
];

const emptyBlock = (type) => {
  switch (type) {
    case 'text':       return { type, content: '' };
    case 'image':      return { type, url: '', caption: '', _file: null, _preview: '' };
    case 'photo_grid': return { type, images: [], _files: [], _previews: [] };
    case 'video':      return { type, url: '', caption: '' };
    case 'embed':      return { type, url: '', caption: '' };
    default:           return { type };
  }
};

export default function ProjectModal({ isOpen, onClose, onSuccess, initialData }) {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [featured, setFeatured] = useState(false);
  const [thumbnailPreview, setThumbnailPreview] = useState('');
  const [thumbnailBlob, setThumbnailBlob] = useState(null);
  const [blocks, setBlocks] = useState([]);
  const [showBlockMenu, setShowBlockMenu] = useState(false);
  const [status, setStatus] = useState({ state: 'idle', message: '' });
  const [cropImage, setCropImage] = useState(null);
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const [croppingTarget, setCroppingTarget] = useState(null); // 'thumbnail' | { blockIdx, gridIdx? }
  const blockMenuRef = useRef(null);

  // Populate form when editing an existing project
  useEffect(() => {
    if (!isOpen) return;
    if (initialData) {
      setTitle(initialData.title || '');
      setCategory(initialData.category || CATEGORIES[0]);
      setFeatured(initialData.featured || false);
      setThumbnailPreview(initialData.thumbnail || '');
      setThumbnailBlob(null);
      // Reconstruct blocks — strip client-side blob/preview fields
      const loadedBlocks = (initialData.blocks || []).map(b => ({
        ...b,
        _file: null,
        _preview: b.type === 'image' ? b.url : '',
        _files: [],
        _previews: b.type === 'photo_grid' ? (b.images || []).map(img => img.url) : [],
      }));
      setBlocks(loadedBlocks);
    } else {
      setTitle('');
      setCategory(CATEGORIES[0]);
      setFeatured(false);
      setThumbnailPreview('');
      setThumbnailBlob(null);
      setBlocks([]);
    }
    setStatus({ state: 'idle', message: '' });
    setShowBlockMenu(false);
  }, [initialData, isOpen]);

  // Close block menu on outside click
  useEffect(() => {
    const handler = (e) => {
      if (blockMenuRef.current && !blockMenuRef.current.contains(e.target)) {
        setShowBlockMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleClose = () => {
    if (status.state === 'uploading') return;
    onClose();
  };

  // ── Thumbnail ──────────────────────────────────────────────────────────────
  const handleThumbnailChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setCroppingTarget('thumbnail');
      setCropImage(reader.result);
      setIsCropModalOpen(true);
    };
    reader.readAsDataURL(file);
  };

  // ── Block helpers ──────────────────────────────────────────────────────────
  const addBlock = (type) => {
    setBlocks(prev => [...prev, emptyBlock(type)]);
    setShowBlockMenu(false);
  };

  const removeBlock = (idx) => {
    setBlocks(prev => prev.filter((_, i) => i !== idx));
  };

  const moveBlock = (idx, dir) => {
    setBlocks(prev => {
      const next = [...prev];
      const swapIdx = idx + dir;
      if (swapIdx < 0 || swapIdx >= next.length) return next;
      [next[idx], next[swapIdx]] = [next[swapIdx], next[idx]];
      return next;
    });
  };

  const updateBlock = (idx, patch) => {
    setBlocks(prev => prev.map((b, i) => i === idx ? { ...b, ...patch } : b));
  };

  // ── Image block: trigger crop ──────────────────────────────────────────────
  const handleImageBlockFile = (idx, e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setCroppingTarget({ blockIdx: idx });
      setCropImage(reader.result);
      setIsCropModalOpen(true);
    };
    reader.readAsDataURL(file);
  };

  // ── Photo grid block ───────────────────────────────────────────────────────
  const handleGridFiles = (idx, e) => {
    const files = Array.from(e.target.files).slice(0, 8);
    const previews = files.map(f => URL.createObjectURL(f));
    updateBlock(idx, {
      _files: files,
      _previews: previews,
      images: previews.map((p, i) => ({ url: p, caption: blocks[idx]?.images?.[i]?.caption || '' })),
    });
  };

  const updateGridCaption = (blockIdx, imgIdx, caption) => {
    setBlocks(prev => prev.map((b, i) => {
      if (i !== blockIdx) return b;
      const images = [...(b.images || [])];
      images[imgIdx] = { ...images[imgIdx], caption };
      return { ...b, images };
    }));
  };

  // ── Crop complete ──────────────────────────────────────────────────────────
  const handleCropComplete = (blob) => {
    setIsCropModalOpen(false);
    if (!blob) { setCropImage(null); return; }

    if (croppingTarget === 'thumbnail') {
      setThumbnailBlob(blob);
      setThumbnailPreview(URL.createObjectURL(blob));
    } else if (croppingTarget?.blockIdx !== undefined) {
      const preview = URL.createObjectURL(blob);
      updateBlock(croppingTarget.blockIdx, { _file: blob, _preview: preview });
    }
    setCropImage(null);
    setCroppingTarget(null);
  };

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!thumbnailBlob && !initialData?.thumbnail) {
      setStatus({ state: 'error', message: 'Please select a cover image.' });
      return;
    }

    setStatus({ state: 'uploading', message: 'Uploading cover image…' });

    try {
      // 1. Thumbnail
      let thumbnailUrl = initialData?.thumbnail || '';
      if (thumbnailBlob) {
        // Compress cover image down to 800px width for fast feed loading
        const compressedThumbnail = await compressImage(thumbnailBlob, 0.8, 800);
        thumbnailUrl = await uploadFile(compressedThumbnail, `users/${user.uid}/projects/${Date.now()}_cover`);
        if (!thumbnailUrl) throw new Error('Cover image upload failed.');
      }

      // 2. Process blocks — upload any local file/blob references
      setStatus({ state: 'uploading', message: 'Processing content blocks…' });
      const finalBlocks = [];

      for (const block of blocks) {
        if (block.type === 'text') {
          if (block.content.trim()) finalBlocks.push({ type: 'text', content: block.content });

        } else if (block.type === 'image') {
          let url = block.url;
          if (block._file) {
            // Compress single image blocks to 1920px max width
            const compressedBlockImg = await compressImage(block._file, 0.85, 1920);
            url = await uploadFile(compressedBlockImg, `users/${user.uid}/projects/${Date.now()}_block`);
            if (!url) throw new Error('An image block failed to upload.');
          }
          if (url) finalBlocks.push({ type: 'image', url, caption: block.caption || '' });

        } else if (block.type === 'photo_grid') {
          const uploadedImages = [];
          for (let i = 0; i < (block._files?.length || 0); i++) {
            const file = block._files[i];
            let url;
            if (file instanceof File) {
              const compressed = await compressImage(file, 0.8, 1600);
              url = await uploadFile(compressed, `users/${user.uid}/projects/${Date.now()}_grid_${i}`);
            } else {
              url = block._previews?.[i] || '';
            }
            if (url) uploadedImages.push({ url, caption: block.images?.[i]?.caption || '' });
          }
          // Preserve existing grid images if no new files were uploaded
          const existingImages = (!block._files?.length && block.images?.filter(img => img.url && !img.url.startsWith('blob:'))) || [];
          const merged = uploadedImages.length ? uploadedImages : existingImages;
          if (merged.length) finalBlocks.push({ type: 'photo_grid', images: merged });

        } else if (block.type === 'video') {
          if (block.url.trim()) finalBlocks.push({ type: 'video', url: block.url, caption: block.caption || '' });

        } else if (block.type === 'embed') {
          if (block.url.trim()) finalBlocks.push({ type: 'embed', url: block.url, caption: block.caption || '' });
        }
      }

      setStatus({ state: 'uploading', message: 'Saving to database…' });

      const payload = {
        title,
        category,
        thumbnail: thumbnailUrl,
        status: featured ? "published" : "draft",
        blocks: finalBlocks,
        ownerId: user.uid
      };

      if (initialData) {
        await updateProject(initialData.id, payload);
        setStatus({ state: 'success', message: 'Project updated!' });
      } else {
        await createProject(user.uid, payload);
        setStatus({ state: 'success', message: 'Project saved!' });
      }

      onSuccess();
      setTimeout(() => handleClose(), 1500);

    } catch (err) {
      console.error('ProjectModal submit error:', err);
      setStatus({ state: 'error', message: err.message || 'Something went wrong.' });
    } finally {
      setStatus(prev => prev.state === 'success' ? prev : { ...prev, state: 'idle' });
    }
  };

  // ── Block renderer ─────────────────────────────────────────────────────────
  const renderBlock = (block, idx) => {
    const isFirst = idx === 0;
    const isLast = idx === blocks.length - 1;
    const isUploading = status.state === 'uploading';

    return (
      <div key={idx} className="group/block relative bg-background/40 border border-white/5 rounded-2xl overflow-hidden">
        {/* Block header bar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-white/2">
          <span className="font-label text-[9px] tracking-[0.25em] uppercase text-accent/60 flex items-center gap-2">
            <span className="material-symbols-outlined text-[14px]">
              {BLOCK_TYPES.find(t => t.type === block.type)?.icon}
            </span>
            {BLOCK_TYPES.find(t => t.type === block.type)?.label}
          </span>
          <div className="flex items-center gap-1">
            <button type="button" onClick={() => moveBlock(idx, -1)} disabled={isFirst || isUploading}
              className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 text-primary-text/40 hover:text-primary-text transition-all flex items-center justify-center disabled:opacity-20"
              title="Move up">
              <span className="material-symbols-outlined text-[14px]">arrow_upward</span>
            </button>
            <button type="button" onClick={() => moveBlock(idx, 1)} disabled={isLast || isUploading}
              className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 text-primary-text/40 hover:text-primary-text transition-all flex items-center justify-center disabled:opacity-20"
              title="Move down">
              <span className="material-symbols-outlined text-[14px]">arrow_downward</span>
            </button>
            <button type="button" onClick={() => removeBlock(idx)} disabled={isUploading}
              className="w-7 h-7 rounded-lg bg-white/5 hover:bg-red-500/20 text-primary-text/40 hover:text-red-400 transition-all flex items-center justify-center disabled:opacity-20"
              title="Delete block">
              <span className="material-symbols-outlined text-[14px]">delete</span>
            </button>
          </div>
        </div>

        {/* Block content */}
        <div className="p-4">
          {block.type === 'text' && (
            <textarea
              rows={4}
              value={block.content}
              onChange={e => updateBlock(idx, { content: e.target.value })}
              disabled={isUploading}
              placeholder="Write your text content here…"
              className="w-full bg-background/50 border border-white/10 rounded-xl p-3 font-body text-sm text-primary-text placeholder:text-white/10 focus:border-accent focus:outline-none transition-colors resize-none"
            />
          )}

          {block.type === 'image' && (
            <div className="space-y-3">
              <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-white/5 border-2 border-dashed border-white/10 hover:border-accent/30 transition-colors flex items-center justify-center group/img">
                {block._preview || block.url ? (
                  <>
                    <img src={block._preview || block.url} className="w-full h-full object-cover opacity-70" alt="Block preview" />
                    <div className="absolute inset-0 bg-background/50 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="font-headline text-[9px] uppercase tracking-[0.2em] text-primary-text bg-background/80 px-4 py-2 rounded-full">Replace Image</span>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center gap-2 text-primary-text/30">
                    <span className="material-symbols-outlined text-3xl">add_photo_alternate</span>
                    <span className="font-label text-[9px] uppercase tracking-wider">Upload Image</span>
                  </div>
                )}
                <input type="file" accept="image/*" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={e => handleImageBlockFile(idx, e)} disabled={isUploading} />
              </div>
              <input type="text" value={block.caption || ''} onChange={e => updateBlock(idx, { caption: e.target.value })} disabled={isUploading}
                placeholder="Caption (optional)"
                className="w-full bg-background/50 border border-white/10 rounded-lg p-3 font-body text-xs text-primary-text placeholder:text-white/10 focus:border-accent focus:outline-none transition-colors" />
            </div>
          )}

          {block.type === 'photo_grid' && (
            <div className="space-y-3">
              <div className="relative w-full min-h-[80px] rounded-xl overflow-hidden bg-white/5 border-2 border-dashed border-white/10 hover:border-accent/30 transition-colors p-3 flex flex-wrap gap-2 items-center justify-center">
                {(block._previews?.length || block.images?.filter(i => i.url)?.length) ? (
                  <>
                    {(block._previews?.length ? block._previews : block.images.map(i => i.url)).map((src, gIdx) => (
                      <div key={gIdx} className="relative w-16 h-16 rounded-lg overflow-hidden shrink-0">
                        <img src={src} className="w-full h-full object-cover" alt={`Grid ${gIdx + 1}`} />
                      </div>
                    ))}
                    <span className="font-label text-[8px] uppercase tracking-wider text-primary-text/30 w-full text-center mt-1">Click to replace all grid images</span>
                  </>
                ) : (
                  <div className="flex flex-col items-center gap-2 text-primary-text/30">
                    <span className="material-symbols-outlined text-2xl">grid_view</span>
                    <span className="font-label text-[9px] uppercase tracking-wider">Upload 2–8 images</span>
                  </div>
                )}
                <input type="file" accept="image/*" multiple className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={e => handleGridFiles(idx, e)} disabled={isUploading} />
              </div>
              {/* Per-image captions */}
              {(block.images || []).filter(img => img.url).map((img, gIdx) => (
                <input key={gIdx} type="text" value={img.caption || ''} onChange={e => updateGridCaption(idx, gIdx, e.target.value)} disabled={isUploading}
                  placeholder={`Caption for image ${gIdx + 1} (optional)`}
                  className="w-full bg-background/50 border border-white/10 rounded-lg p-2 font-body text-xs text-primary-text placeholder:text-white/10 focus:border-accent focus:outline-none transition-colors" />
              ))}
            </div>
          )}

          {(block.type === 'video' || block.type === 'embed') && (
            <div className="space-y-3">
              <input type="url" value={block.url || ''} onChange={e => updateBlock(idx, { url: e.target.value })} disabled={isUploading}
                placeholder={block.type === 'video' ? 'YouTube / Vimeo embed URL…' : 'Figma / Spline / Behance embed URL…'}
                className="w-full bg-background/50 border border-white/10 rounded-xl p-3 font-body text-sm text-primary-text placeholder:text-white/10 focus:border-accent focus:outline-none transition-colors" />
              <input type="text" value={block.caption || ''} onChange={e => updateBlock(idx, { caption: e.target.value })} disabled={isUploading}
                placeholder="Caption (optional)"
                className="w-full bg-background/50 border border-white/10 rounded-lg p-3 font-body text-xs text-primary-text placeholder:text-white/10 focus:border-accent focus:outline-none transition-colors" />
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div key="overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-md z-[100]" onClick={handleClose} />

          <motion.div key="modal"
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[95vw] md:w-[90vw] max-w-2xl bg-card-bg border border-white/5 p-6 md:p-10 rounded-[32px] shadow-[0_30px_100px_rgba(0,0,0,0.8)] z-[101] max-h-[90vh] overflow-y-auto"
          >
            <ImageCropModal
              isOpen={isCropModalOpen}
              image={cropImage}
              onCancel={() => { setIsCropModalOpen(false); setCropImage(null); }}
              onCropComplete={handleCropComplete}
            />

            {/* Header */}
            <div className="flex justify-between items-center mb-8">
              <div>
                <span className="font-label text-[10px] tracking-[0.3em] uppercase text-accent mb-2 block">Portfolio CMS</span>
                <h2 className="font-headline font-extrabold text-2xl uppercase tracking-wider text-primary-text">
                  {initialData ? 'Edit Project' : 'New Project'}
                </h2>
              </div>
              <button type="button" onClick={handleClose}
                className="w-10 h-10 bg-white/5 rounded-full text-primary-text/40 hover:bg-white/10 hover:text-red-400 transition-colors flex items-center justify-center"
                aria-label="Close modal">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {/* Status message */}
            {status.message && (
              <div className={`p-4 rounded-xl font-body text-sm mb-6 flex items-center gap-3 ${
                status.state === 'error'   ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                status.state === 'success' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                'bg-accent/10 text-accent border border-accent/20'
              }`}>
                {status.state === 'uploading' && <div className="w-4 h-4 border-2 border-accent border-t-transparent flex-shrink-0 rounded-full animate-spin" />}
                {status.message}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Title */}
              <div className="space-y-2">
                <label className="font-label text-[10px] tracking-[0.2em] uppercase text-primary-text/40 ml-1">Project Title <span className="text-accent">*</span></label>
                <input type="text" value={title} onChange={e => setTitle(e.target.value)} required
                  placeholder="e.g. Zara Noir — Brand Identity"
                  disabled={status.state === 'uploading'}
                  className="w-full bg-background/50 border border-white/10 rounded-xl p-4 font-body text-primary-text placeholder:text-white/10 focus:border-accent focus:outline-none transition-colors" />
              </div>

              {/* Category + Featured row */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="font-label text-[10px] tracking-[0.2em] uppercase text-primary-text/40 ml-1">Category <span className="text-accent">*</span></label>
                  <select value={category} onChange={e => setCategory(e.target.value)} disabled={status.state === 'uploading'}
                    className="w-full bg-background/50 border border-white/10 rounded-xl p-4 font-body text-sm text-primary-text focus:border-accent focus:outline-none transition-colors appearance-none cursor-pointer">
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="font-label text-[10px] tracking-[0.2em] uppercase text-primary-text/40 ml-1">Visibility</label>
                  <button type="button" onClick={() => setFeatured(f => !f)} disabled={status.state === 'uploading'}
                    className={`w-full p-4 rounded-xl border font-headline text-xs uppercase tracking-wider transition-all flex items-center gap-3 ${
                      featured ? 'border-accent bg-accent/10 text-accent' : 'border-white/10 bg-background/50 text-primary-text/40'
                    }`}>
                    <span className="material-symbols-outlined text-sm">{featured ? 'star' : 'star_outline'}</span>
                    {featured ? 'Featured' : 'Standard'}
                  </button>
                </div>
              </div>

              {/* Cover Image */}
              <div className="space-y-2">
                <label className="font-label text-[10px] tracking-[0.2em] uppercase text-primary-text/40 ml-1">Cover Image <span className="text-accent">*</span></label>
                <div className="relative w-full aspect-[16/7] rounded-2xl overflow-hidden bg-white/5 border-2 border-dashed border-white/10 hover:border-accent/30 transition-colors flex items-center justify-center group/thumb">
                  {thumbnailPreview ? (
                    <>
                      <img src={thumbnailPreview} className="absolute inset-0 w-full h-full object-cover opacity-60" alt="Cover preview" />
                      <div className="absolute inset-0 bg-background/50 opacity-0 group-hover/thumb:opacity-100 transition-opacity flex items-center justify-center z-10">
                        <span className="font-headline text-[9px] uppercase tracking-[0.2em] text-primary-text bg-background/80 px-4 py-2 rounded-full">Replace Cover</span>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center gap-3 text-primary-text/30 relative z-10">
                      <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center">
                        <span className="material-symbols-outlined text-accent text-xl">add_photo_alternate</span>
                      </div>
                      <div className="text-center">
                        <p className="font-body text-sm"><span className="text-accent font-medium">Click to upload</span> cover image</p>
                        <p className="font-label text-[9px] uppercase tracking-wider text-primary-text/30 mt-1">JPEG · PNG · WebP</p>
                      </div>
                    </div>
                  )}
                  <input type="file" accept="image/*" onChange={handleThumbnailChange} disabled={status.state === 'uploading'}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20" required={!initialData} />
                </div>
              </div>

              {/* Content Blocks */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <label className="font-label text-[10px] tracking-[0.2em] uppercase text-primary-text/40">Content Blocks</label>
                  <span className="font-label text-[9px] text-primary-text/20 uppercase tracking-wider">{blocks.length} block{blocks.length !== 1 ? 's' : ''}</span>
                </div>

                {/* Block list */}
                <div className="space-y-3">
                  <AnimatePresence mode="popLayout">
                    {blocks.map((block, idx) => (
                      <motion.div key={idx}
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.2 }}>
                        {renderBlock(block, idx)}
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>

                {/* Add block button */}
                <div className="relative" ref={blockMenuRef}>
                  <button type="button" onClick={() => setShowBlockMenu(s => !s)} disabled={status.state === 'uploading'}
                    className="w-full py-3 rounded-xl border-2 border-dashed border-white/10 hover:border-accent/40 text-primary-text/30 hover:text-accent font-headline text-[10px] uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 disabled:opacity-40">
                    <span className="material-symbols-outlined text-[16px]">add</span>
                    Add Block
                  </button>
                  <AnimatePresence>
                    {showBlockMenu && (
                      <motion.div initial={{ opacity: 0, y: -8, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8, scale: 0.96 }}
                        className="absolute bottom-full mb-2 left-0 w-full bg-card-bg border border-white/10 rounded-2xl overflow-hidden shadow-2xl z-20">
                        {BLOCK_TYPES.map(bt => (
                          <button key={bt.type} type="button" onClick={() => addBlock(bt.type)}
                            className="w-full flex items-center gap-4 px-5 py-4 hover:bg-white/5 transition-colors text-left group/btn">
                            <span className="material-symbols-outlined text-accent/60 group-hover/btn:text-accent transition-colors text-[18px]">{bt.icon}</span>
                            <div>
                              <p className="font-headline text-xs font-bold uppercase tracking-wide text-primary-text">{bt.label}</p>
                            </div>
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Footer actions */}
              <div className="pt-6 border-t border-white/5 flex flex-col-reverse sm:flex-row justify-end gap-4 items-center">
                <button type="button" onClick={handleClose} disabled={status.state === 'uploading'}
                  className="w-full sm:w-auto font-headline text-[11px] font-bold uppercase tracking-widest text-primary-text/50 hover:text-primary-text transition-colors disabled:opacity-50 py-2">
                  Cancel
                </button>
                <button type="submit" disabled={status.state === 'uploading'}
                  className="w-full sm:w-auto bg-accent text-on-accent px-8 py-4 rounded-full font-headline font-bold text-xs uppercase tracking-widest shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:hover:scale-100">
                  {status.state === 'uploading' ? (
                    <><div className="w-4 h-4 border-2 border-on-accent border-t-transparent rounded-full animate-spin" /> Publishing…</>
                  ) : (
                    <><span className="material-symbols-outlined text-[1rem]">cloud_done</span> {initialData ? 'Update' : 'Publish'}</>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
