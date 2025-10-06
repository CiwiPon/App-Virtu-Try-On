import React, { useState, useCallback } from 'react';

interface ImageUploaderProps {
  id: string;
  title: string;
  onFileUpload: (file: File) => void;
  previewUrl: string | null;
}

const UploadIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400/80" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 12v9m0-9l-3 3m3-3l3 3" />
    </svg>
);

export const ImageUploader: React.FC<ImageUploaderProps> = ({ id, title, onFileUpload, previewUrl }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      if (e.dataTransfer.files[0].type.startsWith('image/')) {
        onFileUpload(e.dataTransfer.files[0]);
      }
      e.dataTransfer.clearData();
    }
  }, [onFileUpload]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      if (e.target.files[0].type.startsWith('image/')) {
        onFileUpload(e.target.files[0]);
      }
    }
  };

  const baseClasses = "w-full aspect-square border-2 border-dashed rounded-3xl flex justify-center items-center transition-all duration-300 relative cursor-pointer";
  const borderStyle = isDragging ? 'border-pink-300 bg-pink-500/10 scale-105 shadow-2xl' : 'border-white/30 bg-white/50';

  return (
    <div className="bg-white/70 backdrop-blur-xl p-6 rounded-3xl shadow-2xl shadow-pink-500/10 w-full max-w-lg mx-auto flex flex-col items-center">
      <h2 className="text-xl font-semibold text-gray-700 mb-4">{title}</h2>
      <div
        className={`${baseClasses} ${borderStyle}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => document.getElementById(id)?.click()}
      >
        <input
          type="file"
          id={id}
          className="hidden"
          accept="image/*"
          onChange={handleFileChange}
        />
        {previewUrl ? (
          <img src={previewUrl} alt="Preview" className="w-full h-full object-contain rounded-2xl p-2" />
        ) : (
          <div className="text-center text-gray-500 pointer-events-none">
            <UploadIcon />
            <p className="font-semibold mt-2">Drag &amp; drop your image</p>
            <p className="text-sm">or click to browse</p>
          </div>
        )}
      </div>
    </div>
  );
};