import React from 'react';
import { Check } from 'lucide-react';

interface Stage {
  id: number;
  name: string;
  status: 'complete' | 'current' | 'upcoming';
}

interface ProgressBarProps {
  stages: Stage[];
}

export function ProgressBar({ stages }: ProgressBarProps) {
  return (
    <div className="relative">
      {/* Progress Line */}
      <div className="absolute top-4 left-4 right-4 h-0.5 bg-gray-200">
        <div 
          className="h-full bg-blue-600 transition-all duration-300"
          style={{ width: '0%' }}
        />
      </div>

      {/* Stages */}
      <div className="relative flex justify-between">
        {stages.map((stage, index) => (
          <div key={stage.id} className="flex flex-col items-center">
            {/* Stage Circle */}
            <div className={`
              w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all duration-300
              ${stage.status === 'complete' 
                ? 'bg-green-600 border-green-600 text-white' 
                : stage.status === 'current'
                ? 'bg-blue-600 border-blue-600 text-white'
                : 'bg-white border-gray-300 text-gray-400'
              }
            `}>
              {stage.status === 'complete' ? (
                <Check className="w-4 h-4" />
              ) : (
                <span className="text-sm">{stage.id}</span>
              )}
            </div>

            {/* Stage Label */}
            <div className="mt-2 text-center">
              <p className={`text-sm ${
                stage.status === 'current' 
                  ? 'text-blue-600' 
                  : stage.status === 'complete'
                  ? 'text-green-600'
                  : 'text-gray-500'
              }`}>
                {stage.name}
              </p>
              {stage.status === 'current' && (
                <div className="mt-1 w-2 h-2 bg-blue-600 rounded-full mx-auto" />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}