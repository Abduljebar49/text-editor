// src/components/StatusBar.tsx
import React from 'react';

interface StatusBarProps {
  wordCount: number;
  characterCount: number;
  hasUnsavedChanges: boolean;
}

export const StatusBar: React.FC<StatusBarProps> = ({
  wordCount,
  characterCount,
  hasUnsavedChanges,
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
        <div>
          Status: <strong className={hasUnsavedChanges ? 'text-orange-600' : 'text-green-600'}>
            {hasUnsavedChanges ? 'Unsaved Changes' : 'Saved'}
          </strong>
        </div>
      </div>
    </div>
  );
};