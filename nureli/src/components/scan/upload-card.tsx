'use client';

import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from '@/lib/motion';
import { cn } from '@/lib/utils';
import { Camera, X, RotateCcw, Check, ImagePlus } from 'lucide-react';

interface UploadCardProps {
  label: string;
  description: string;
  tips: string[];
  value: string | null;
  onChange: (base64: string | null) => void;
}

export function UploadCard({ label, description, tips, value, onChange }: UploadCardProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => onChange(e.target?.result as string);
    reader.readAsDataURL(file);
  }, [onChange]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="w-full">
      <div className="mb-6">
        <h3
          className="text-[22px] font-bold text-neutral-900 tracking-tight"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {label}
        </h3>
        <p className="text-[14px] text-neutral-500 mt-1.5 leading-relaxed">{description}</p>
      </div>

      <AnimatePresence mode="wait">
        {value ? (
          <motion.div
            key="preview"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="relative overflow-hidden rounded-2xl shadow-card"
          >
            <img src={value} alt={label} className="h-60 w-full object-cover rounded-2xl" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent rounded-2xl" />
            <div className="absolute top-3 right-3 flex gap-2">
              <button
                onClick={() => { onChange(null); if (inputRef.current) inputRef.current.value = ''; }}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-black/30 backdrop-blur-md text-white active:scale-95 transition-transform hover:bg-black/40"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
              <button
                onClick={() => { onChange(null); if (inputRef.current) inputRef.current.value = ''; }}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-black/30 backdrop-blur-md text-white active:scale-95 transition-transform hover:bg-black/40"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="absolute bottom-3 left-3 flex items-center gap-2 rounded-xl bg-black/30 px-3 py-2 backdrop-blur-md">
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-500">
                <Check className="h-3 w-3 text-white" strokeWidth={3} />
              </div>
              <span className="text-[12px] font-semibold text-white">Ready</span>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="upload"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className={cn(
              'relative flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed py-16 px-6 transition-all duration-200 active:scale-[0.98]',
              isDragOver
                ? 'border-brand-500 bg-brand-50/50'
                : 'border-neutral-200 bg-white hover:bg-neutral-50 hover:border-neutral-300'
            )}
            onDragOver={(e: React.DragEvent) => { e.preventDefault(); setIsDragOver(true); }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
          >
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-neutral-100">
              <ImagePlus className="h-6 w-6 text-neutral-400" />
            </div>
            <p className="mb-1 text-[14px] font-semibold text-neutral-900">
              Tap to upload or take photo
            </p>
            <p className="text-[12px] text-neutral-400 font-medium">JPEG, PNG up to 10MB</p>
          </motion.div>
        )}
      </AnimatePresence>

      {!value && tips.length > 0 && (
        <div
          className="mt-5 rounded-xl bg-neutral-50 p-4 space-y-2.5"
          style={{ border: '1px solid rgba(0,0,0,0.04)' }}
        >
          <p className="text-[11px] font-bold text-neutral-500 uppercase tracking-[0.1em]">Guidelines</p>
          {tips.map((tip) => (
            <p key={tip} className="flex items-start gap-2.5 text-[12px] text-neutral-500 leading-[1.55]">
              <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-brand-400" />
              {tip}
            </p>
          ))}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
      />
    </motion.div>
  );
}
