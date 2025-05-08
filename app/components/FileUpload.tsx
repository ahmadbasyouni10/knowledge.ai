import { useState, useRef } from "react";
import { cn } from "../lib/utils";
import { DocumentTextIcon, XCircleIcon } from "@heroicons/react/24/outline";

type FileUploadProps = {
  onFileChange: (file: File | null) => void;
  className?: string;
};

export function FileUpload({ onFileChange, className }: FileUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    if (selectedFile && selectedFile.type !== "application/pdf") {
      alert("Only PDF files are allowed");
      return;
    }
    setFile(selectedFile);
    onFileChange(selectedFile);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile && droppedFile.type !== "application/pdf") {
      alert("Only PDF files are allowed");
      return;
    }
    
    setFile(droppedFile);
    onFileChange(droppedFile);
  };

  const handleRemoveFile = () => {
    setFile(null);
    onFileChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className={className}>
      <div
        className={cn(
          "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
          isDragging ? "border-indigo-500 bg-indigo-50" : "border-gray-300 hover:border-indigo-400",
          file ? "bg-gray-50" : ""
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        {file ? (
          <div className="flex flex-col items-center">
            <DocumentTextIcon className="w-12 h-12 text-indigo-600 mb-2" />
            <div className="text-sm font-medium text-gray-700">{file.name}</div>
            <div className="text-xs text-gray-500 mt-1">
              {(file.size / 1024 / 1024).toFixed(2)} MB
            </div>
            <button
              type="button"
              className="mt-2 inline-flex items-center text-sm text-red-500 hover:text-red-700"
              onClick={(e) => {
                e.stopPropagation();
                handleRemoveFile();
              }}
            >
              <XCircleIcon className="w-4 h-4 mr-1" />
              Remove
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <DocumentTextIcon className="w-12 h-12 text-gray-400 mb-2" />
            <p className="text-sm text-gray-700">
              Drag and drop your PDF or click to browse
            </p>
            <p className="text-xs text-gray-500 mt-1">Max file size: 10MB</p>
          </div>
        )}
      </div>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".pdf"
        className="hidden"
      />
    </div>
  );
} 