// src/components/StatusBar.tsx - Minimal Version
import React from 'react';
import { Save, Image as ImageIcon } from 'lucide-react';

interface StatusBarProps {
  wordCount: number;
  characterCount: number;
  hasUnsavedChanges: boolean;
  pendingImagesCount?: number;
}

export const StatusBar: React.FC<StatusBarProps> = ({
  wordCount,
  characterCount,
  hasUnsavedChanges,
  pendingImagesCount = 0,
}) => {
  return (
    <div className="flex justify-between items-center px-5 py-3 bg-gray-50 border-t border-gray-200 text-sm text-gray-600">
      <div className="flex items-center gap-6">
        <div>
          Words: <strong className="text-gray-800">{wordCount}</strong>
        </div>
        <div>
          Characters: <strong className="text-gray-800">{characterCount}</strong>
        </div>
        {pendingImagesCount > 0 && (
          <div className="flex items-center gap-1">
            <ImageIcon size={14} className="text-blue-600" />
            <span className="text-blue-600">
              {pendingImagesCount} image{pendingImagesCount !== 1 ? 's' : ''}
            </span>
          </div>
        )}
      </div>
      
      <div className="flex items-center gap-2">
        <div className={`flex items-center gap-1 ${
          hasUnsavedChanges ? 'text-orange-600' : 'text-green-600'
        }`}>
          {hasUnsavedChanges && <Save size={14} className="animate-pulse" />}
          <strong>
            {hasUnsavedChanges ? 'Unsaved Changes' : 'Saved'}
          </strong>
        </div>
      </div>
    </div>
  );
};