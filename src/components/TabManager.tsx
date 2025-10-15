import React from 'react';
import { X, FileText, Folder, Globe } from 'lucide-react';
import { Tab } from '../types';

interface TabManagerProps {
  tabs: Tab[];
  activeTabId: string;
  onTabSelect: (tabId: string) => void;
  onTabClose: (tabId: string) => void;
  onNewTab: () => void;
}

export function TabManager({ tabs, activeTabId, onTabSelect, onTabClose, onNewTab }: TabManagerProps) {
  const getTabIcon = (tab: Tab) => {
    switch (tab.type) {
      case 'request':
        return <FileText className="w-4 h-4" />;
      case 'collection':
        return <Folder className="w-4 h-4" />;
      case 'environment':
        return <Globe className="w-4 h-4" />;
    }
  };

  return (
    <div className="bg-gray-800 border-b border-gray-700 flex items-center overflow-x-auto">
      <div className="flex items-center">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            className={`flex items-center space-x-2 px-4 py-2 border-r border-gray-700 cursor-pointer group min-w-0 ${
              activeTabId === tab.id
                ? 'bg-gray-900 text-white'
                : 'bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-750'
            }`}
            onClick={() => onTabSelect(tab.id)}
          >
            <div className="flex items-center space-x-2 min-w-0 flex-1">
              {getTabIcon(tab)}
              <span className="text-sm truncate max-w-32">
                {tab.name}
                {tab.unsaved && <span className="text-orange-400 ml-1">*</span>}
              </span>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onTabClose(tab.id);
              }}
              className="opacity-0 group-hover:opacity-100 hover:bg-gray-600 rounded p-1 transition-all"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>
      <button
        onClick={onNewTab}
        className="px-4 py-2 text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
        title="New Request"
      >
        +
      </button>
    </div>
  );
}