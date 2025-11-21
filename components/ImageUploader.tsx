import React, { useRef, useState } from 'react';
import { Upload, Image as ImageIcon, X } from 'lucide-react';
import { Button } from './Button';

interface ImageUploaderProps {
  onImageSelect: (file: File) => void;
  selectedImage: string | null;
  onClear: () => void;
  heightClass?: string;
  placeholderIcon?: React.ReactNode;
  placeholderText?: string;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ 
  onImageSelect, 
  selectedImage, 
  onClear,
  heightClass = "h-[300px]", // Default height, but overridable
  placeholderIcon,
  placeholderText = "Drag & drop or click to upload"
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert("Please upload an image file");
      return;
    }
    // Simple check for size, e.g., < 10MB
    if (file.size > 10 * 1024 * 1024) {
      alert("File size too large. Please upload an image smaller than 10MB.");
      return;
    }
    onImageSelect(file);
  };

  const triggerSelect = () => {
    fileInputRef.current?.click();
  };

  if (selectedImage) {
    return (
      <div className={`relative group w-full ${heightClass} bg-slate-100 rounded-xl overflow-hidden border border-slate-200 flex items-center justify-center`}>
         <img 
           src={selectedImage} 
           alt="Preview" 
           className="w-full h-full object-contain p-2"
         />
         <div className="absolute top-2 right-2">
            <button 
              onClick={onClear}
              className="bg-black/50 hover:bg-red-600 text-white p-1.5 rounded-full backdrop-blur-sm transition-all"
              title="Remove image"
            >
              <X size={16} />
            </button>
         </div>
      </div>
    );
  }

  return (
    <div 
      className={`relative w-full ${heightClass} flex flex-col items-center justify-center p-4 border-2 border-dashed rounded-xl transition-all duration-200 ${
        dragActive 
          ? "border-indigo-500 bg-indigo-50" 
          : "border-slate-300 bg-slate-50 hover:bg-slate-100 hover:border-indigo-300"
      }`}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      onClick={triggerSelect} // Make whole area clickable
    >
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept="image/*"
        onChange={handleChange}
      />
      
      <div className="bg-white p-3 rounded-full mb-3 shadow-sm">
        {placeholderIcon || <Upload className="w-6 h-6 text-indigo-500" />}
      </div>
      
      <p className="text-slate-600 text-sm font-medium text-center mb-1">
        {placeholderText}
      </p>
      <p className="text-xs text-slate-400">
        Supports JPG, PNG, WEBP
      </p>
    </div>
  );
};
