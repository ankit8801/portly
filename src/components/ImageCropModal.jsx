import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { motion, AnimatePresence } from 'framer-motion';
import getCroppedImg from '../utils/cropImage';

const ASPECT_RATIOS = [
  { label: 'Square (1:1)', value: 1 / 1 },
  { label: 'Standard (4:3)', value: 4 / 3 },
  { label: 'Widescreen (16:9)', value: 16 / 9 },
];

export default function ImageCropModal({ isOpen, image, onCancel, onCropComplete }) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [aspect, setAspect] = useState(16 / 9);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const onCropChange = useCallback((crop) => {
    setCrop(crop);
  }, []);

  const onZoomChange = useCallback((zoom) => {
    setZoom(zoom);
  }, []);

  const onCropCompleteInternal = useCallback((_croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleApplyCrop = async () => {
    if (!croppedAreaPixels) return;
    setIsProcessing(true);
    try {
      const croppedBlob = await getCroppedImg(image, croppedAreaPixels);
      onCropComplete(croppedBlob);
    } catch (e) {
      console.error(e);
      alert('Failed to crop image. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-background/95 backdrop-blur-xl"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="relative w-[95vw] md:w-[90vw] max-w-4xl bg-card-bg border border-white/10 rounded-[32px] overflow-hidden shadow-[0_50px_100px_rgba(0,0,0,0.9)] flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="flex-shrink-0 p-4 md:p-8 border-b border-white/5 flex justify-between items-center bg-card-bg/50 backdrop-blur-md">
            <div>
              <span className="font-label text-[10px] tracking-[0.3em] uppercase text-accent mb-1 block italic">Refining Perspective</span>
              <h2 className="font-headline font-bold text-xl uppercase tracking-wider text-primary-text">Crop Image</h2>
            </div>
            <button 
              onClick={onCancel}
              className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center text-primary-text/40 hover:text-red-400 hover:bg-white/10 transition-all active:scale-90"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>

          {/* Main Content Area (Scrollable) */}
          <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col">
            {/* Cropper Container - Fixed Height */}
            <div className="relative h-[250px] sm:h-[350px] md:h-[450px] flex-shrink-0 bg-[#0a0a0a] border-b border-white/5">
              <Cropper
                image={image}
                crop={crop}
                zoom={zoom}
                aspect={aspect}
                onCropChange={onCropChange}
                onCropComplete={onCropCompleteInternal}
                onZoomChange={onZoomChange}
                classes={{
                  containerClassName: "bg-[#0a0a0a]",
                  mediaClassName: "opacity-90"
                }}
              />
            </div>

            {/* Controls Section */}
            <div className="p-4 md:p-8 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-end">
                {/* Aspect Ratios */}
                <div className="space-y-4">
                  <label className="font-label text-[10px] tracking-[0.2em] uppercase text-primary-text/40 block ml-1">Aspect Ratio</label>
                  <div className="flex gap-2">
                    {ASPECT_RATIOS.map((arr) => (
                      <button
                        key={arr.value}
                        type="button"
                        onClick={() => setAspect(arr.value)}
                        className={`flex-1 py-3 px-2 rounded-xl text-[9px] font-headline font-bold uppercase tracking-widest transition-all ${
                          aspect === arr.value 
                          ? 'bg-accent text-on-accent shadow-lg shadow-accent/20' 
                          : 'bg-white/5 text-primary-text/40 hover:bg-white/10 hover:text-primary-text'
                        }`}
                      >
                        {arr.label.split(' ')[0]}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Zoom Slider */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center px-1">
                    <label className="font-label text-[10px] tracking-[0.2em] uppercase text-primary-text/40 block">Zoom Detail</label>
                    <span className="font-body text-[10px] text-accent font-bold">{(zoom * 100).toFixed(0)}%</span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={3}
                    step={0.1}
                    value={zoom}
                    onChange={(e) => setZoom(Number(e.target.value))}
                    className="w-full h-1.5 bg-white/5 rounded-full appearance-none cursor-pointer accent-accent hover:accent-accent/80 transition-all"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Footer - Fixed Bottom */}
          <div className="flex-shrink-0 p-6 md:p-8 border-t border-white/5 bg-card-bg/50 backdrop-blur-md">
            <div className="flex flex-col-reverse sm:flex-row justify-end gap-4 sm:gap-6 items-center">
              <button
                type="button"
                onClick={onCancel}
                disabled={isProcessing}
                className="w-full sm:w-auto font-headline text-[11px] font-bold uppercase tracking-widest text-primary-text/40 hover:text-primary-text transition-colors disabled:opacity-30 py-2"
              >
                Discard
              </button>
              <button
                type="button"
                onClick={handleApplyCrop}
                disabled={isProcessing}
                className="w-full sm:w-auto bg-accent text-on-accent px-10 py-4 rounded-full font-headline font-bold text-xs uppercase tracking-widest shadow-xl shadow-accent/20 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:hover:scale-100"
              >
                {isProcessing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-on-accent border-t-transparent rounded-full animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[1.1rem]">crop</span>
                    Crop & Upload
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
