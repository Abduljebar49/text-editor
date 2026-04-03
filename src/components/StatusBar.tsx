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
    <div className="status-bar flex justify-between items-center px-5 py-3 bg-gray-50 border-t border-gray-200 text-sm text-gray-600">
      <div className="status-bar-content flex items-center gap-6">
        <div className="status-item">
          Words: <strong className="status-value text-gray-800">{wordCount}</strong>
        </div>
        <div className="status-item">
          Characters: <strong className="status-value text-gray-800">{characterCount}</strong>
        </div>
        {pendingImagesCount > 0 && (
          <div className="status-item flex items-center gap-1">
            <ImageIcon size={14} className="status-value text-blue-600" />
            <span className="status-value text-blue-600">
              {pendingImagesCount} image{pendingImagesCount !== 1 ? 's' : ''}
            </span>
          </div>
        )}
      </div>
      
      <div className="status-bar-content flex items-center gap-2">
        <div className={`flex items-center gap-1 ${
          hasUnsavedChanges ? 'status-unsaved' : 'status-saved'
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