import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, FileText, FileType, File, Eye, Trash2, RotateCcw, CheckCircle, Clock, AlertCircle, ExternalLink, AlertTriangle } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { toast } from 'sonner@2.0.3';

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

interface PreviouslyUploadedFilesProps {
  currentFiles: UploadedFile[];
  onFilesUpdate: () => void;
}

export function PreviouslyUploadedFiles({ currentFiles, onFilesUpdate }: PreviouslyUploadedFilesProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [allFiles, setAllFiles] = useState<UploadedFile[]>([]);
  const [duplicateWarnings, setDuplicateWarnings] = useState<string[]>([]);

  useEffect(() => {
    loadAllFiles();
  }, []);

  useEffect(() => {
    // Check for duplicates when current files change
    checkForDuplicates();
  }, [currentFiles, allFiles]);

  const loadAllFiles = async () => {
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-0fb30735/files?limit=50`, {
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
        setAllFiles(formattedFiles);
      }
    } catch (error) {
      console.error('Error loading all files:', error);
    }
  };

  const checkForDuplicates = () => {
    const currentFileNames = currentFiles.map(f => f.name.toLowerCase());
    const previousFileNames = allFiles
      .filter(f => !currentFiles.some(cf => cf.id === f.id))
      .map(f => f.name.toLowerCase());
    
    const duplicates = currentFileNames.filter(name => 
      previousFileNames.includes(name)
    );
    
    setDuplicateWarnings(duplicates);
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
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString();
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'pdf':
        return <FileType className="w-4 h-4 text-red-500" />;
      case 'docx':
      case 'doc':
        return <FileText className="w-4 h-4 text-blue-500" />;
      case 'txt':
        return <File className="w-4 h-4 text-gray-500" />;
      default:
        return <File className="w-4 h-4 text-gray-500" />;
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
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'complete':
        return <Badge variant="secondary" className="bg-green-100 text-green-700 hover:bg-green-100">Complete</Badge>;
      case 'analyzing':
        return <Badge variant="secondary" className="bg-amber-100 text-amber-700 hover:bg-amber-100">Analyzing</Badge>;
      case 'queued':
        return <Badge variant="secondary" className="bg-gray-100 text-gray-600 hover:bg-gray-100">Queued</Badge>;
      case 'error':
        return <Badge variant="secondary" className="bg-red-100 text-red-700 hover:bg-red-100">Error</Badge>;
      default:
        return null;
    }
  };

  const previewFile = (file: UploadedFile) => {
    if (file.signedUrl) {
      window.open(file.signedUrl, '_blank');
    }
  };

  const reprocessFile = async (fileId: string) => {
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-0fb30735/files/${fileId}/reprocess`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
        },
      });

      if (response.ok) {
        toast.success('File queued for reprocessing');
        loadAllFiles();
        onFilesUpdate();
      } else {
        toast.error('Failed to reprocess file');
      }
    } catch (error) {
      console.error('Error reprocessing file:', error);
      toast.error('Failed to reprocess file');
    }
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
        setAllFiles(files => files.filter(f => f.id !== fileId));
        onFilesUpdate();
        toast.success('File removed successfully');
      } else {
        toast.error('Failed to remove file');
      }
    } catch (error) {
      console.error('Error removing file:', error);
      toast.error('Failed to remove file');
    }
  };

  // Filter out files that are currently being uploaded/shown in the main upload area
  const previousFiles = allFiles.filter(file => 
    !currentFiles.some(currentFile => currentFile.id === file.id)
  );

  const completedFiles = previousFiles.filter(f => f.status === 'complete');
  const processingFiles = previousFiles.filter(f => f.status === 'analyzing' || f.status === 'queued');
  const errorFiles = previousFiles.filter(f => f.status === 'error');

  return (
    <Card className="overflow-hidden">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <Button 
            variant="ghost" 
            className="w-full p-6 h-auto justify-between hover:bg-gray-50"
          >
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <h3 className="text-base text-gray-900">Previously Uploaded Files</h3>
                <Badge variant="secondary" className="bg-blue-100 text-blue-700 hover:bg-blue-100">
                  {previousFiles.length}
                </Badge>
              </div>
              
              {duplicateWarnings.length > 0 && (
                <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-md px-2 py-1">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span className="text-sm text-amber-700">
                    {duplicateWarnings.length} duplicate{duplicateWarnings.length > 1 ? 's' : ''} detected
                  </span>
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-4">
              {previousFiles.length > 0 && (
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  {completedFiles.length > 0 && (
                    <div className="flex items-center gap-1">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span>{completedFiles.length} complete</span>
                    </div>
                  )}
                  {processingFiles.length > 0 && (
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4 text-amber-600" />
                      <span>{processingFiles.length} processing</span>
                    </div>
                  )}
                  {errorFiles.length > 0 && (
                    <div className="flex items-center gap-1">
                      <AlertTriangle className="w-4 h-4 text-red-500" />
                      <span>{errorFiles.length} error</span>
                    </div>
                  )}
                </div>
              )}
              
              {isOpen ? (
                <ChevronUp className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-400" />
              )}
            </div>
          </Button>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          {duplicateWarnings.length > 0 && (
            <div className="px-6 pb-4">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
                  <div>
                    <h4 className="text-sm text-amber-800 mb-1">Duplicate Files Detected</h4>
                    <p className="text-sm text-amber-700 mb-2">
                      The following files have the same names as previously uploaded files:
                    </p>
                    <ul className="text-sm text-amber-700 space-y-1">
                      {duplicateWarnings.map((fileName, index) => (
                        <li key={index} className="flex items-center gap-2">
                          <span className="w-1 h-1 bg-amber-600 rounded-full"></span>
                          {fileName}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div className="px-6 pb-6">
            {previousFiles.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <File className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p>No previously uploaded files</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm text-gray-600">
                    Showing {Math.min(previousFiles.length, 10)} of {previousFiles.length} files
                  </p>
                  <Button variant="outline" size="sm" className="text-blue-600 hover:text-blue-700">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    View All Files
                  </Button>
                </div>
                
                <div className="space-y-3">
                  {previousFiles.slice(0, 10).map((file, index) => (
                    <div key={file.id}>
                      <div className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          {getFileIcon(file.type)}
                          <div className="min-w-0 flex-1">
                            <p className="text-sm text-gray-900 truncate">{file.name}</p>
                            <div className="flex items-center gap-3 text-xs text-gray-500">
                              <span>{file.size}</span>
                              <span>•</span>
                              <span>{file.uploadDate}</span>
                              {file.analysisResults && (
                                <>
                                  <span>•</span>
                                  <span>{file.analysisResults.topics} topics, {file.analysisResults.entities} entities</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          {getStatusBadge(file.status)}
                          
                          <div className="flex gap-1">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => previewFile(file)}
                              disabled={!file.signedUrl}
                              className="h-8 w-8 p-0"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            {(file.status === 'error' || file.status === 'complete') && (
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => reprocessFile(file.id)}
                                className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700"
                              >
                                <RotateCcw className="w-4 h-4" />
                              </Button>
                            )}
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => removeFile(file.id)}
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                      {index < Math.min(previousFiles.length, 10) - 1 && (
                        <Separator className="mt-3" />
                      )}
                    </div>
                  ))}
                </div>
                
                {previousFiles.length > 10 && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <Button variant="outline" className="w-full" size="sm">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      View All {previousFiles.length} Files in Content Dashboard
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}