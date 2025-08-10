import React, { useState, useEffect } from 'react';
import { ProgressBar } from './components/ProgressBar';
import { FileUpload } from './components/FileUpload';
import { ConfigurationPanel } from './components/ConfigurationPanel';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from './components/ui/breadcrumb';
import { Button } from './components/ui/button';
import { Settings } from 'lucide-react';
import { projectId, publicAnonKey } from './utils/supabase/info';
import { toast } from 'sonner@2.0.3';

const stages = [
  { id: 1, name: 'Content Analysis', status: 'current' },
  { id: 2, name: 'Data Processing', status: 'upcoming' },
  { id: 3, name: 'Model Configuration', status: 'upcoming' },
  { id: 4, name: 'Training Setup', status: 'upcoming' },
  { id: 5, name: 'Training Execution', status: 'upcoming' },
  { id: 6, name: 'Model Validation', status: 'upcoming' }
];

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

export default function App() {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [config, setConfig] = useState({
    model: 'Advanced NLP',
    topicCount: 15,
    topicDepth: 'Detailed',
    confidenceThreshold: 0.75,
    entityTypes: ['People', 'Organizations', 'Locations'],
    domainAdaptation: 'Business',
    relationshipMapping: true,
    segmentationMethod: 'Auto',
    chunkSize: 2000,
    hierarchyDetection: true,
    qualityLevel: 'Standard',
    processingPriority: 'Balanced',
    languageDetection: 'Auto',
    contentType: 'Documents'
  });

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);

  const hasFiles = uploadedFiles.length > 0;
  const readyFiles = uploadedFiles.filter(f => f.status === 'queued' || f.status === 'complete');
  const analyzingFiles = uploadedFiles.filter(f => f.status === 'analyzing');
  const errorFiles = uploadedFiles.filter(f => f.status === 'error');

  const saveConfiguration = async () => {
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-0fb30735/configuration`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify({
          ...config,
          name: `Configuration ${new Date().toLocaleString()}`
        }),
      });

      if (response.ok) {
        toast.success('Configuration saved successfully');
      } else {
        const error = await response.json();
        console.error('Failed to save configuration:', error);
        toast.error('Failed to save configuration');
      }
    } catch (error) {
      console.error('Error saving configuration:', error);
      toast.error('Failed to save configuration');
    }
  };

  const startAnalysis = async () => {
    if (!hasFiles || isAnalyzing) return;

    try {
      setIsAnalyzing(true);
      
      const fileIds = uploadedFiles
        .filter(f => f.status === 'queued' || f.status === 'complete')
        .map(f => f.id);

      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-0fb30735/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify({
          fileIds,
          configuration: config
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setCurrentJobId(data.jobId);
        toast.success('Analysis started successfully!');
        
        // Show progress notification
        toast.info(`Analyzing ${fileIds.length} files. Estimated completion: ${new Date(data.estimatedCompletion).toLocaleTimeString()}`);
      } else {
        const error = await response.json();
        console.error('Failed to start analysis:', error);
        toast.error('Failed to start analysis');
        setIsAnalyzing(false);
      }
    } catch (error) {
      console.error('Error starting analysis:', error);
      toast.error('Failed to start analysis');
      setIsAnalyzing(false);
    }
  };

  // Check analysis status
  useEffect(() => {
    if (currentJobId && isAnalyzing) {
      const checkStatus = async () => {
        try {
          const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-0fb30735/analysis/${currentJobId}`, {
            headers: {
              'Authorization': `Bearer ${publicAnonKey}`,
            },
          });

          if (response.ok) {
            const data = await response.json();
            if (data.job.status === 'completed') {
              setIsAnalyzing(false);
              setCurrentJobId(null);
              toast.success('Analysis completed successfully!', {
                description: 'All files have been processed and results are ready.',
                duration: 5000,
              });
            }
          }
        } catch (error) {
          console.error('Error checking analysis status:', error);
        }
      };

      const interval = setInterval(checkStatus, 3000); // Check every 3 seconds
      return () => clearInterval(interval);
    }
  }, [currentJobId, isAnalyzing]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Section */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          {/* Breadcrumb */}
          <Breadcrumb className="mb-4">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="#" className="text-gray-500">Projects</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href="#" className="text-gray-500">Bright Run Training</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbPage className="text-gray-900">Content Analysis</BreadcrumbPage>
            </BreadcrumbList>
          </Breadcrumb>

          {/* Project Title */}
          <div className="mb-6">
            <h1 className="text-2xl text-gray-900 mb-2">Bright Run LoRA Training Data Pipeline</h1>
            <p className="text-gray-600">Upload and analyze your content to extract topics, entities, and structure</p>
          </div>

          {/* Progress Bar */}
          <ProgressBar stages={stages} />
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Left Column - File Upload (60% width) */}
          <div className="lg:col-span-3">
            <FileUpload 
              files={uploadedFiles} 
              onFilesChange={setUploadedFiles}
            />
          </div>

          {/* Right Column - Configuration (40% width) */}
          <div className="lg:col-span-2">
            <ConfigurationPanel 
              config={config} 
              onConfigChange={setConfig}
              filesCount={uploadedFiles.length}
              readyFilesCount={readyFiles.length}
              analyzingFilesCount={analyzingFiles.length}
              isAnalyzing={isAnalyzing}
              hasFiles={hasFiles}
              onStartAnalysis={startAnalysis}
            />
          </div>
        </div>

        {/* Bottom Settings Bar */}
        <div className="mt-8 bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            {/* Status Legend */}
            <div className="flex items-center gap-6">
              <span className="text-sm text-gray-700">File Status:</span>
              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-200 border border-green-400"></div>
                  <span className="text-gray-600">Ready</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-amber-200 border border-amber-400"></div>
                  <span className="text-gray-600">Analyzing</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-200 border border-red-400"></div>
                  <span className="text-gray-600">Failed</span>
                </div>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              <Button variant="ghost" className="text-blue-600 hover:text-blue-700">
                <Settings className="w-4 h-4 mr-2" />
                Advanced Settings
              </Button>
              <Button variant="outline" onClick={saveConfiguration}>
                Save Configuration
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}