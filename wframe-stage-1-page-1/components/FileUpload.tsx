import React, { useState, useRef, useEffect } from 'react';
import { Upload, File, FileText, FileType, Trash2, Eye, Plus, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { Card } from './ui/card';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface UploadedFile {
  id: string;
  name: string;
  size: string;
  type: string;
  uploadDate: string;
  status: 'queued' | 'analyzing' | 'complete' | 'error';
  signedUrl?: string;
  analysisResults?: any;
}

interface FileUploadProps {
  files: UploadedFile[];
  onFilesChange: (files: UploadedFile[]) => void;
}

export function FileUpload({ files, onFilesChange }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load files from server on component mount
  useEffect(() => {
    loadFiles();
    
    // Poll for file status updates every 5 seconds
    const interval = setInterval(loadFiles, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadFiles = async () => {
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-0fb30735/files`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const formattedFiles = data.files.map((file: any) => ({
          id: file.id,
          name: file.name,
          size: formatFileSize(file.size),
          type: getFileTypeFromMime(file.type),
          uploadDate: formatDate(file.uploadDate),
          status: file.status,
          signedUrl: file.signedUrl,
          analysisResults: file.analysisResults
        }));
        onFilesChange(formattedFiles);
      }
    } catch (error) {
      console.error('Error loading files:', error);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getFileTypeFromMime = (mimeType: string): string => {
    if (mimeType.includes('pdf')) return 'pdf';
    if (mimeType.includes('wordprocessingml') || mimeType.includes('msword')) return 'docx';
    if (mimeType.includes('text')) return 'txt';
    return 'unknown';
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString();
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'pdf':
        return <FileType className="w-5 h-5 text-red-500" />;
      case 'docx':
      case 'doc':
        return <FileText className="w-5 h-5 text-blue-500" />;
      case 'txt':
        return <File className="w-5 h-5 text-gray-500" />;
      default:
        return <File className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'complete':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'analyzing':
        return <Clock className="w-4 h-4 text-amber-600 animate-spin" />;
      case 'queued':
        return <AlertCircle className="w-4 h-4 text-gray-400" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusText = (status: string, analysisResults?: any) => {
    switch (status) {
      case 'complete':
        return analysisResults 
          ? `Complete (${analysisResults.topics} topics, ${analysisResults.entities} entities)`
          : 'Analysis Complete';
      case 'analyzing':
        return 'Analyzing...';
      case 'queued':
        return 'Queued for Analysis';
      case 'error':
        return 'Analysis Failed';
      default:
        return 'Unknown';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    uploadFiles(droppedFiles);
  };

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      uploadFiles(selectedFiles);
    }
  };

  const uploadFiles = async (filesToUpload: File[]) => {
    setIsUploading(true);

    for (const file of filesToUpload) {
      try {
        // Initialize progress for this file
        const fileKey = `${Date.now()}-${file.name}`;
        setUploadProgress(prev => ({ ...prev, [fileKey]: 0 }));

        const formData = new FormData();
        formData.append('file', file);

        // Simulate progress
        const progressInterval = setInterval(() => {
          setUploadProgress(prev => ({
            ...prev,
            [fileKey]: Math.min((prev[fileKey] || 0) + Math.random() * 30, 90)
          }));
        }, 200);

        const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-0fb30735/upload`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
          body: formData,
        });

        clearInterval(progressInterval);

        if (response.ok) {
          const data = await response.json();
          setUploadProgress(prev => ({ ...prev, [fileKey]: 100 }));
          
          // Remove progress after a delay
          setTimeout(() => {
            setUploadProgress(prev => {
              const newProgress = { ...prev };
              delete newProgress[fileKey];
              return newProgress;
            });
          }, 1000);

          // Reload files to get the updated list
          await loadFiles();
        } else {
          const error = await response.json();
          console.error('Upload failed:', error);
          setUploadProgress(prev => {
            const newProgress = { ...prev };
            delete newProgress[fileKey];
            return newProgress;
          });
        }
      } catch (error) {
        console.error('Upload error:', error);
        const fileKey = `${Date.now()}-${file.name}`;
        setUploadProgress(prev => {
          const newProgress = { ...prev };
          delete newProgress[fileKey];
          return newProgress;
        });
      }
    }

    setIsUploading(false);
  };

  const removeFile = async (fileId: string) => {
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-0fb30735/files/${fileId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
        },
      });

      if (response.ok) {
        onFilesChange(files.filter(file => file.id !== fileId));
      } else {
        console.error('Failed to delete file');
      }
    } catch (error) {
      console.error('Error deleting file:', error);
    }
  };

  const previewFile = (file: UploadedFile) => {
    if (file.signedUrl) {
      window.open(file.signedUrl, '_blank');
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload Zone */}
      <Card className="p-8">
        <div 
          className={`
            border-2 border-dashed rounded-lg p-12 text-center transition-all duration-200
            ${isDragging 
              ? 'border-blue-500 bg-blue-50' 
              : 'border-gray-300 hover:border-gray-400'
            }
          `}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg text-gray-900 mb-2">Drop files here or click to browse</h3>
          <p className="text-gray-600 mb-4">
            Support for TXT, DOC, DOCX, PDF files
          </p>
          
          {/* File Type Icons */}
          <div className="flex justify-center gap-4 mb-6">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <File className="w-4 h-4" />
              TXT
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <FileText className="w-4 h-4" />
              DOC
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <FileText className="w-4 h-4" />
              DOCX
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <FileType className="w-4 h-4" />
              PDF
            </div>
          </div>

          <Button 
            onClick={handleFileSelect} 
            className="bg-blue-600 hover:bg-blue-700"
            disabled={isUploading}
          >
            <Upload className="w-4 h-4 mr-2" />
            {isUploading ? 'Uploading...' : 'Choose Files'}
          </Button>
          
          <p className="text-xs text-gray-500 mt-3">
            Maximum file size: 100MB per file
          </p>
          
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".txt,.doc,.docx,.pdf"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
      </Card>

      {/* Active Upload Progress */}
      {Object.keys(uploadProgress).length > 0 && (
        <Card className="p-4">
          <h4 className="text-gray-900 mb-3">Uploading Files</h4>
          {Object.entries(uploadProgress).map(([fileKey, progress]) => (
            <div key={fileKey} className="mb-2">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Uploading {fileKey.split('-').slice(1).join('-')}...</span>
                <span className="text-gray-600">{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          ))}
        </Card>
      )}

      {/* Uploaded Files List */}
      {files.length > 0 && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-gray-900">Uploaded Files ({files.length})</h4>
            <Button variant="outline" size="sm" onClick={handleFileSelect}>
              <Plus className="w-4 h-4 mr-2" />
              Add More Files
            </Button>
          </div>

          <div className="space-y-3">
            {files.map((file) => (
              <div 
                key={file.id} 
                className={`flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 ${
                  file.status === 'complete' ? 'border-green-200 bg-green-50' :
                  file.status === 'analyzing' ? 'border-amber-200 bg-amber-50' :
                  file.status === 'error' ? 'border-red-200 bg-red-50' :
                  'border-gray-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  {getFileIcon(file.type)}
                  <div>
                    <p className="text-gray-900">{file.name}</p>
                    <p className="text-sm text-gray-500">
                      {file.size} • Uploaded {file.uploadDate}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 text-sm">
                    {getStatusIcon(file.status)}
                    <span className={`
                      ${file.status === 'complete' ? 'text-green-600' : 
                        file.status === 'analyzing' ? 'text-amber-600' : 
                        file.status === 'error' ? 'text-red-600' :
                        'text-gray-500'}
                    `}>
                      {getStatusText(file.status, file.analysisResults)}
                    </span>
                  </div>

                  <div className="flex gap-1">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => previewFile(file)}
                      disabled={!file.signedUrl}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => removeFile(file.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}