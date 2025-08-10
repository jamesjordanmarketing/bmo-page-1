import React, { useEffect, useState } from 'react';
import { ChevronDown, ChevronRight, HelpCircle, CheckCircle, Clock } from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Slider } from './ui/slider';
import { Switch } from './ui/switch';
import { Checkbox } from './ui/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface ConfigurationPanelProps {
  config: any;
  onConfigChange: (config: any) => void;
  filesCount?: number;
  readyFilesCount?: number;
  analyzingFilesCount?: number;
  isAnalyzing?: boolean;
  hasFiles?: boolean;
  onStartAnalysis?: () => void;
}

export function ConfigurationPanel({ 
  config, 
  onConfigChange, 
  filesCount = 0,
  readyFilesCount = 0,
  analyzingFilesCount = 0,
  isAnalyzing = false,
  hasFiles = false,
  onStartAnalysis
}: ConfigurationPanelProps) {
  const [openSections, setOpenSections] = React.useState({
    topicExtraction: true,
    entityRecognition: false,
    contentStructure: false,
    processingOptions: false
  });

  const [savedConfigurations, setSavedConfigurations] = useState([]);

  // Load saved configurations on mount
  useEffect(() => {
    loadSavedConfigurations();
  }, []);

  const loadSavedConfigurations = async () => {
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-0fb30735/configurations`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSavedConfigurations(data.configurations);
      }
    } catch (error) {
      console.error('Error loading configurations:', error);
    }
  };

  const toggleSection = (section: string) => {
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const updateConfig = (key: string, value: any) => {
    onConfigChange({ ...config, [key]: value });
  };

  const loadConfiguration = (configId: string) => {
    const savedConfig = savedConfigurations.find((c: any) => c.id === configId);
    if (savedConfig) {
      // Extract only the configuration properties, excluding metadata
      const { id, savedAt, name, ...configProps } = savedConfig;
      onConfigChange(configProps);
    }
  };

  const HelpTooltip = ({ content }: { content: string }) => (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <HelpCircle className="w-4 h-4 text-gray-400 hover:text-gray-600 cursor-help" />
        </TooltipTrigger>
        <TooltipContent>
          <p className="max-w-xs text-sm">{content}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );

  return (
    <div className="space-y-4">
      {/* Analysis Ready Section */}
      <Card className="p-4 bg-blue-50 border-blue-200">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-blue-900 font-medium">Analysis Ready</h4>
          <span className="text-sm text-blue-700">{filesCount} files queued</span>
        </div>
        
        <div className="space-y-2 mb-4">
          {analyzingFilesCount > 0 && (
            <div className="flex items-center gap-2 text-sm text-blue-700">
              <Clock className="w-4 h-4 text-amber-600" />
              <span>{analyzingFilesCount} analyzing</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-sm text-blue-700">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <span>{readyFilesCount} ready for analysis</span>
          </div>
        </div>

        <Button 
          className={`w-full ${isAnalyzing 
            ? 'bg-amber-600 hover:bg-amber-700' 
            : 'bg-blue-600 hover:bg-blue-700'} text-white`}
          disabled={!hasFiles}
          onClick={onStartAnalysis}
        >
          {isAnalyzing ? (
            <>
              <Clock className="w-4 h-4 mr-2 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <CheckCircle className="w-4 h-4 mr-2" />
              Start Analysis
            </>
          )}
        </Button>

        <p className="text-sm text-blue-700 mt-3">Configuration saved automatically</p>
      </Card>

      {/* Topic Extraction Settings */}
      <Card className="p-4">
        <Collapsible open={openSections.topicExtraction} onOpenChange={() => toggleSection('topicExtraction')}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full flex items-center justify-between p-0 h-auto">
              <div className="flex items-center gap-2">
                <h4 className="text-gray-900">Topic Extraction Settings</h4>
                <HelpTooltip content="Configure how topics are identified and extracted from your content" />
              </div>
              {openSections.topicExtraction ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-4 space-y-4">
            <div>
              <label className="block text-sm text-gray-700 mb-2">Model Selection</label>
              <Select value={config.model} onValueChange={(value) => updateConfig('model', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Advanced NLP">Advanced NLP</SelectItem>
                  <SelectItem value="Fast Processing">Fast Processing</SelectItem>
                  <SelectItem value="Custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm text-gray-700">Number of Topics</label>
                <span className="text-sm text-gray-500">{config.topicCount}</span>
              </div>
              <Slider
                value={[config.topicCount]}
                onValueChange={(value) => updateConfig('topicCount', value[0])}
                min={5}
                max={50}
                step={1}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-700 mb-2">Topic Depth Level</label>
              <Select value={config.topicDepth} onValueChange={(value) => updateConfig('topicDepth', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Surface">Surface</SelectItem>
                  <SelectItem value="Detailed">Detailed</SelectItem>
                  <SelectItem value="Comprehensive">Comprehensive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm text-gray-700">Confidence Threshold</label>
                <span className="text-sm text-gray-500">{config.confidenceThreshold}</span>
              </div>
              <Slider
                value={[config.confidenceThreshold]}
                onValueChange={(value) => updateConfig('confidenceThreshold', value[0])}
                min={0.5}
                max={0.95}
                step={0.05}
                className="w-full"
              />
            </div>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* Entity Recognition */}
      <Card className="p-4">
        <Collapsible open={openSections.entityRecognition} onOpenChange={() => toggleSection('entityRecognition')}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full flex items-center justify-between p-0 h-auto">
              <div className="flex items-center gap-2">
                <h4 className="text-gray-900">Entity Recognition</h4>
                <HelpTooltip content="Identify and extract entities like people, organizations, and locations" />
              </div>
              {openSections.entityRecognition ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-4 space-y-4">
            <div>
              <label className="block text-sm text-gray-700 mb-3">Entity Types</label>
              <div className="space-y-2">
                {['People', 'Organizations', 'Locations', 'Dates', 'Custom'].map((type) => (
                  <div key={type} className="flex items-center space-x-2">
                    <Checkbox 
                      id={type}
                      checked={config.entityTypes.includes(type)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          updateConfig('entityTypes', [...config.entityTypes, type]);
                        } else {
                          updateConfig('entityTypes', config.entityTypes.filter((t: string) => t !== type));
                        }
                      }}
                    />
                    <label htmlFor={type} className="text-sm text-gray-700 cursor-pointer">
                      {type}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-700 mb-2">Domain Adaptation</label>
              <Select value={config.domainAdaptation} onValueChange={(value) => updateConfig('domainAdaptation', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Business">Business</SelectItem>
                  <SelectItem value="Technical">Technical</SelectItem>
                  <SelectItem value="Academic">Academic</SelectItem>
                  <SelectItem value="General">General</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm text-gray-700">Relationship Mapping</label>
                <p className="text-xs text-gray-500">Map connections between entities</p>
              </div>
              <Switch 
                checked={config.relationshipMapping}
                onCheckedChange={(checked) => updateConfig('relationshipMapping', checked)}
              />
            </div>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* Content Structure */}
      <Card className="p-4">
        <Collapsible open={openSections.contentStructure} onOpenChange={() => toggleSection('contentStructure')}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full flex items-center justify-between p-0 h-auto">
              <div className="flex items-center gap-2">
                <h4 className="text-gray-900">Content Structure</h4>
                <HelpTooltip content="Configure how content is segmented and structured for analysis" />
              </div>
              {openSections.contentStructure ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-4 space-y-4">
            <div>
              <label className="block text-sm text-gray-700 mb-2">Segmentation Method</label>
              <Select value={config.segmentationMethod} onValueChange={(value) => updateConfig('segmentationMethod', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Auto">Auto</SelectItem>
                  <SelectItem value="Manual chunks">Manual chunks</SelectItem>
                  <SelectItem value="By sections">By sections</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm text-gray-700">Chunk Size (words)</label>
                <span className="text-sm text-gray-500">{config.chunkSize}</span>
              </div>
              <Slider
                value={[config.chunkSize]}
                onValueChange={(value) => updateConfig('chunkSize', value[0])}
                min={500}
                max={5000}
                step={100}
                className="w-full"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm text-gray-700">Hierarchy Detection</label>
                <p className="text-xs text-gray-500">Detect document structure automatically</p>
              </div>
              <Switch 
                checked={config.hierarchyDetection}
                onCheckedChange={(checked) => updateConfig('hierarchyDetection', checked)}
              />
            </div>

            <div>
              <label className="block text-sm text-gray-700 mb-2">Quality Assessment Level</label>
              <Select value={config.qualityLevel} onValueChange={(value) => updateConfig('qualityLevel', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Basic">Basic</SelectItem>
                  <SelectItem value="Standard">Standard</SelectItem>
                  <SelectItem value="Comprehensive">Comprehensive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* Processing Options */}
      <Card className="p-4">
        <Collapsible open={openSections.processingOptions} onOpenChange={() => toggleSection('processingOptions')}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full flex items-center justify-between p-0 h-auto">
              <div className="flex items-center gap-2">
                <h4 className="text-gray-900">Processing Options</h4>
                <HelpTooltip content="Control how content is processed and analyzed" />
              </div>
              {openSections.processingOptions ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-4 space-y-4">
            <div>
              <label className="block text-sm text-gray-700 mb-2">Processing Priority</label>
              <Select value={config.processingPriority} onValueChange={(value) => updateConfig('processingPriority', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Fast">Fast</SelectItem>
                  <SelectItem value="Balanced">Balanced</SelectItem>
                  <SelectItem value="Thorough">Thorough</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm text-gray-700 mb-2">Language Detection</label>
              <Select value={config.languageDetection} onValueChange={(value) => updateConfig('languageDetection', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Auto">Auto</SelectItem>
                  <SelectItem value="English">English</SelectItem>
                  <SelectItem value="Spanish">Spanish</SelectItem>
                  <SelectItem value="French">French</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm text-gray-700 mb-2">Content Type Hint</label>
              <Select value={config.contentType} onValueChange={(value) => updateConfig('contentType', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Documents">Documents</SelectItem>
                  <SelectItem value="Conversations">Conversations</SelectItem>
                  <SelectItem value="Technical">Technical</SelectItem>
                  <SelectItem value="Creative">Creative</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* Recent Configurations */}
      <Card className="p-4">
        <h4 className="text-gray-900 mb-3">Recent Configurations</h4>
        <Select onValueChange={loadConfiguration}>
          <SelectTrigger>
            <SelectValue placeholder="Load saved configuration..." />
          </SelectTrigger>
          <SelectContent>
            {savedConfigurations.map((config: any) => (
              <SelectItem key={config.id} value={config.id}>
                {config.name}
              </SelectItem>
            ))}
            {savedConfigurations.length === 0 && (
              <SelectItem value="none" disabled>No saved configurations</SelectItem>
            )}
          </SelectContent>
        </Select>
      </Card>
    </div>
  );
}