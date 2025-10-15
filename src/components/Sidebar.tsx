import React, { useState } from 'react';
import { 
  FolderPlus, 
  Plus, 
  ChevronRight, 
  ChevronDown, 
  Folder, 
  FileText,
  Globe,
  Settings,
  Search,
  MoreHorizontal
} from 'lucide-react';
import { Collection, Environment, ApiRequest } from '../types';

interface SidebarProps {
  collections: Collection[];
  environments: Environment[];
  activeEnvironment: Environment | null;
  onCreateCollection: () => void;
  onCreateRequest: (collectionId?: string) => void;
  onCreateEnvironment: () => void;
  onSelectRequest: (request: ApiRequest, collectionId: string) => void;
  onSelectEnvironment: (environment: Environment) => void;
  onDeleteCollection: (collectionId: string) => void;
  onDeleteRequest: (requestId: string, collectionId: string) => void;
  className?: string;
}

export function Sidebar({
  collections,
  environments,
  activeEnvironment,
  onCreateCollection,
  onCreateRequest,
  onCreateEnvironment,
  onSelectRequest,
  onSelectEnvironment,
  onDeleteCollection,
  onDeleteRequest,
  className = ''
}: SidebarProps) {
  const [expandedCollections, setExpandedCollections] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');

  const toggleCollection = (collectionId: string) => {
    const newExpanded = new Set(expandedCollections);
    if (newExpanded.has(collectionId)) {
      newExpanded.delete(collectionId);
    } else {
      newExpanded.add(collectionId);
    }
    setExpandedCollections(newExpanded);
  };

  const filteredCollections = collections.filter(collection => 
    collection.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    collection.requests.some(request => 
      request.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  const getMethodColor = (method: string) => {
    const colors = {
      GET: 'text-green-400',
      POST: 'text-yellow-400',
      PUT: 'text-blue-400',
      DELETE: 'text-red-400',
      PATCH: 'text-purple-400',
      HEAD: 'text-gray-400',
      OPTIONS: 'text-gray-400'
    };
    return colors[method as keyof typeof colors] || 'text-gray-400';
  };

  return (
    <div className={`bg-gray-900 border-r border-gray-800 flex flex-col ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-800">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-white font-semibold text-lg">API Studio</h1>
          <Settings className="w-5 h-5 text-gray-400 hover:text-white cursor-pointer transition-colors" />
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search collections..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-gray-800 text-white pl-10 pr-4 py-2 rounded-lg border border-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
          />
        </div>
      </div>

      {/* Environment Selector */}
      <div className="p-4 border-b border-gray-800">
        <div className="flex items-center justify-between mb-2">
          <span className="text-gray-300 text-sm font-medium">Environment</span>
          <button
            onClick={onCreateEnvironment}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
        <select
          value={activeEnvironment?.id || ''}
          onChange={(e) => {
            const env = environments.find(env => env.id === e.target.value);
            if (env) onSelectEnvironment(env);
          }}
          className="w-full bg-gray-800 text-white px-3 py-2 rounded-lg border border-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
        >
          <option value="">No Environment</option>
          {environments.map(env => (
            <option key={env.id} value={env.id}>{env.name}</option>
          ))}
        </select>
      </div>

      {/* Collections */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <span className="text-gray-300 text-sm font-medium">Collections</span>
            <div className="flex space-x-1">
              <button
                onClick={() => onCreateRequest()}
                title="New Request"
                className="text-gray-400 hover:text-white transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
              <button
                onClick={onCreateCollection}
                title="New Collection"
                className="text-gray-400 hover:text-white transition-colors"
              >
                <FolderPlus className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="space-y-1">
            {filteredCollections.map(collection => (
              <div key={collection.id} className="group">
                <div className="flex items-center justify-between px-2 py-2 rounded-lg hover:bg-gray-800 cursor-pointer">
                  <div 
                    className="flex items-center flex-1"
                    onClick={() => toggleCollection(collection.id)}
                  >
                    {expandedCollections.has(collection.id) ? (
                      <ChevronDown className="w-4 h-4 text-gray-400 mr-2" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-gray-400 mr-2" />
                    )}
                    <Folder className="w-4 h-4 text-blue-400 mr-2" />
                    <span className="text-gray-300 text-sm">{collection.name}</span>
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 flex items-center space-x-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onCreateRequest(collection.id);
                      }}
                      title="Add Request"
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteCollection(collection.id);
                      }}
                      title="Delete Collection"
                      className="text-gray-400 hover:text-red-400 transition-colors"
                    >
                      <MoreHorizontal className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {expandedCollections.has(collection.id) && (
                  <div className="ml-6 space-y-1">
                    {collection.requests
                      .filter(request => 
                        !searchQuery || 
                        request.name.toLowerCase().includes(searchQuery.toLowerCase())
                      )
                      .map(request => (
                      <div
                        key={request.id}
                        className="group flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-gray-800 cursor-pointer"
                        onClick={() => onSelectRequest(request, collection.id)}
                      >
                        <div className="flex items-center flex-1 min-w-0">
                          <FileText className="w-3 h-3 text-gray-400 mr-2 flex-shrink-0" />
                          <span className={`text-xs font-mono mr-2 flex-shrink-0 ${getMethodColor(request.method)}`}>
                            {request.method}
                          </span>
                          <span className="text-gray-300 text-sm truncate">{request.name}</span>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteRequest(request.id, collection.id);
                          }}
                          className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-400 transition-colors"
                        >
                          <MoreHorizontal className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {filteredCollections.length === 0 && searchQuery && (
            <div className="text-center py-8">
              <p className="text-gray-400 text-sm">No collections found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}