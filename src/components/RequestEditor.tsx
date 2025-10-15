import React, { useState } from 'react';
import { Send, Plus, Trash2, Eye, EyeOff } from 'lucide-react';
import { ApiRequest, Header, Param, EnvironmentVariable } from '../types';

interface RequestEditorProps {
  request: ApiRequest;
  environmentVariables: EnvironmentVariable[];
  onUpdateRequest: (request: ApiRequest) => void;
  onSendRequest: () => void;
  loading: boolean;
}

export function RequestEditor({ 
  request, 
  environmentVariables,
  onUpdateRequest, 
  onSendRequest, 
  loading 
}: RequestEditorProps) {
  const [activeTab, setActiveTab] = useState<'params' | 'headers' | 'body' | 'auth'>('params');

  const updateRequest = (updates: Partial<ApiRequest>) => {
    onUpdateRequest({ ...request, ...updates });
  };

  const addHeader = () => {
    const newHeader: Header = {
      id: Date.now().toString(),
      key: '',
      value: '',
      enabled: true
    };
    updateRequest({
      headers: [...request.headers, newHeader]
    });
  };

  const updateHeader = (id: string, updates: Partial<Header>) => {
    updateRequest({
      headers: request.headers.map(header => 
        header.id === id ? { ...header, ...updates } : header
      )
    });
  };

  const removeHeader = (id: string) => {
    updateRequest({
      headers: request.headers.filter(header => header.id !== id)
    });
  };

  const addParam = () => {
    const newParam: Param = {
      id: Date.now().toString(),
      key: '',
      value: '',
      enabled: true
    };
    updateRequest({
      params: [...request.params, newParam]
    });
  };

  const updateParam = (id: string, updates: Partial<Param>) => {
    updateRequest({
      params: request.params.map(param => 
        param.id === id ? { ...param, ...updates } : param
      )
    });
  };

  const removeParam = (id: string) => {
    updateRequest({
      params: request.params.filter(param => param.id !== id)
    });
  };

  const replaceVariables = (text: string) => {
    let result = text;
    environmentVariables.forEach(variable => {
      if (variable.enabled) {
        const regex = new RegExp(`{{${variable.key}}}`, 'g');
        result = result.replace(regex, variable.value);
      }
    });
    return result;
  };

  const methodColors = {
    GET: 'bg-green-600 hover:bg-green-700',
    POST: 'bg-yellow-600 hover:bg-yellow-700',
    PUT: 'bg-blue-600 hover:bg-blue-700',
    DELETE: 'bg-red-600 hover:bg-red-700',
    PATCH: 'bg-purple-600 hover:bg-purple-700',
    HEAD: 'bg-gray-600 hover:bg-gray-700',
    OPTIONS: 'bg-gray-600 hover:bg-gray-700'
  };

  return (
    <div className="flex flex-col h-full bg-gray-900">
      {/* Request URL Bar */}
      <div className="p-4 border-b border-gray-800">
        <div className="flex items-center space-x-3">
          <select
            value={request.method}
            onChange={(e) => updateRequest({ method: e.target.value as any })}
            className="px-3 py-2 bg-gray-800 text-white border border-gray-700 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
          >
            <option value="GET">GET</option>
            <option value="POST">POST</option>
            <option value="PUT">PUT</option>
            <option value="DELETE">DELETE</option>
            <option value="PATCH">PATCH</option>
            <option value="HEAD">HEAD</option>
            <option value="OPTIONS">OPTIONS</option>
          </select>
          
          <div className="flex-1 relative">
            <input
              type="text"
              value={request.url}
              onChange={(e) => updateRequest({ url: e.target.value })}
              placeholder="Enter request URL"
              className="w-full px-4 py-2 bg-gray-800 text-white border border-gray-700 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
            />
            {request.url && request.url !== replaceVariables(request.url) && (
              <div className="absolute top-full left-0 right-0 mt-1 px-4 py-2 bg-gray-700 text-gray-300 text-sm rounded-lg z-10">
                <span className="text-gray-400">Preview:</span> {replaceVariables(request.url)}
              </div>
            )}
          </div>

          <button
            onClick={onSendRequest}
            disabled={loading || !request.url.trim()}
            className={`px-6 py-2 ${methodColors[request.method]} text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 transition-colors`}
          >
            <Send className="w-4 h-4" />
            <span>{loading ? 'Sending...' : 'Send'}</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-800">
        <nav className="flex space-x-8 px-4">
          {(['params', 'headers', 'body', 'auth'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-3 px-1 border-b-2 font-medium text-sm capitalize ${
                activeTab === tab
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-gray-400 hover:text-gray-300'
              }`}
            >
              {tab}
              {tab === 'params' && request.params.filter(p => p.enabled && p.key).length > 0 && (
                <span className="ml-2 bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full">
                  {request.params.filter(p => p.enabled && p.key).length}
                </span>
              )}
              {tab === 'headers' && request.headers.filter(h => h.enabled && h.key).length > 0 && (
                <span className="ml-2 bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full">
                  {request.headers.filter(h => h.enabled && h.key).length}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'params' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-white font-medium">Query Parameters</h3>
              <button
                onClick={addParam}
                className="flex items-center space-x-2 text-blue-400 hover:text-blue-300 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Add Parameter</span>
              </button>
            </div>

            {request.params.map((param) => (
              <div key={param.id} className="flex items-center space-x-3 bg-gray-800 p-3 rounded-lg">
                <button
                  onClick={() => updateParam(param.id, { enabled: !param.enabled })}
                  className={`p-1 rounded ${param.enabled ? 'text-green-400' : 'text-gray-400'}`}
                >
                  {param.enabled ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
                <input
                  type="text"
                  value={param.key}
                  onChange={(e) => updateParam(param.id, { key: e.target.value })}
                  placeholder="Key"
                  className="flex-1 px-3 py-2 bg-gray-700 text-white border border-gray-600 rounded focus:border-blue-500 outline-none"
                />
                <input
                  type="text"
                  value={param.value}
                  onChange={(e) => updateParam(param.id, { value: e.target.value })}
                  placeholder="Value"
                  className="flex-1 px-3 py-2 bg-gray-700 text-white border border-gray-600 rounded focus:border-blue-500 outline-none"
                />
                <button
                  onClick={() => removeParam(param.id)}
                  className="text-red-400 hover:text-red-300 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}

            {request.params.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-400">No parameters added yet</p>
                <button
                  onClick={addParam}
                  className="mt-2 text-blue-400 hover:text-blue-300 transition-colors"
                >
                  Add your first parameter
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'headers' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-white font-medium">Headers</h3>
              <button
                onClick={addHeader}
                className="flex items-center space-x-2 text-blue-400 hover:text-blue-300 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Add Header</span>
              </button>
            </div>

            {request.headers.map((header) => (
              <div key={header.id} className="flex items-center space-x-3 bg-gray-800 p-3 rounded-lg">
                <button
                  onClick={() => updateHeader(header.id, { enabled: !header.enabled })}
                  className={`p-1 rounded ${header.enabled ? 'text-green-400' : 'text-gray-400'}`}
                >
                  {header.enabled ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
                <input
                  type="text"
                  value={header.key}
                  onChange={(e) => updateHeader(header.id, { key: e.target.value })}
                  placeholder="Header name"
                  className="flex-1 px-3 py-2 bg-gray-700 text-white border border-gray-600 rounded focus:border-blue-500 outline-none"
                />
                <input
                  type="text"
                  value={header.value}
                  onChange={(e) => updateHeader(header.id, { value: e.target.value })}
                  placeholder="Header value"
                  className="flex-1 px-3 py-2 bg-gray-700 text-white border border-gray-600 rounded focus:border-blue-500 outline-none"
                />
                <button
                  onClick={() => removeHeader(header.id)}
                  className="text-red-400 hover:text-red-300 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}

            {request.headers.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-400">No headers added yet</p>
                <button
                  onClick={addHeader}
                  className="mt-2 text-blue-400 hover:text-blue-300 transition-colors"
                >
                  Add your first header
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'body' && (
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <span className="text-white font-medium">Body Type:</span>
              <div className="flex space-x-4">
                {(['none', 'raw', 'form', 'urlencoded'] as const).map((type) => (
                  <label key={type} className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="bodyType"
                      value={type}
                      checked={request.body.type === type}
                      onChange={(e) => updateRequest({
                        body: { ...request.body, type: e.target.value as any }
                      })}
                      className="text-blue-500 focus:ring-blue-500"
                    />
                    <span className="text-gray-300 capitalize">{type}</span>
                  </label>
                ))}
              </div>
            </div>

            {request.body.type === 'raw' && (
              <div className="space-y-3">
                <div className="flex items-center space-x-4">
                  <span className="text-gray-300">Content Type:</span>
                  <select
                    value={request.body.rawType}
                    onChange={(e) => updateRequest({
                      body: { ...request.body, rawType: e.target.value as any }
                    })}
                    className="px-3 py-1 bg-gray-800 text-white border border-gray-700 rounded focus:border-blue-500 outline-none"
                  >
                    <option value="json">JSON</option>
                    <option value="text">Text</option>
                    <option value="xml">XML</option>
                    <option value="html">HTML</option>
                  </select>
                </div>
                <textarea
                  value={request.body.content}
                  onChange={(e) => updateRequest({
                    body: { ...request.body, content: e.target.value }
                  })}
                  placeholder={request.body.rawType === 'json' ? '{\n  "key": "value"\n}' : 'Enter request body...'}
                  className="w-full h-64 px-4 py-3 bg-gray-800 text-white border border-gray-700 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none font-mono text-sm"
                />
              </div>
            )}
          </div>
        )}

        {activeTab === 'auth' && (
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <span className="text-white font-medium">Authentication Type:</span>
              <select
                value={request.auth.type}
                onChange={(e) => updateRequest({
                  auth: { ...request.auth, type: e.target.value as any }
                })}
                className="px-3 py-2 bg-gray-800 text-white border border-gray-700 rounded focus:border-blue-500 outline-none"
              >
                <option value="none">No Auth</option>
                <option value="bearer">Bearer Token</option>
                <option value="basic">Basic Auth</option>
                <option value="apikey">API Key</option>
              </select>
            </div>

            {request.auth.type === 'bearer' && (
              <div className="space-y-3">
                <label className="block">
                  <span className="text-gray-300 mb-2 block">Bearer Token</span>
                  <input
                    type="text"
                    value={request.auth.token || ''}
                    onChange={(e) => updateRequest({
                      auth: { ...request.auth, token: e.target.value }
                    })}
                    placeholder="Enter bearer token"
                    className="w-full px-4 py-2 bg-gray-800 text-white border border-gray-700 rounded focus:border-blue-500 outline-none"
                  />
                </label>
              </div>
            )}

            {request.auth.type === 'basic' && (
              <div className="grid grid-cols-2 gap-4">
                <label className="block">
                  <span className="text-gray-300 mb-2 block">Username</span>
                  <input
                    type="text"
                    value={request.auth.username || ''}
                    onChange={(e) => updateRequest({
                      auth: { ...request.auth, username: e.target.value }
                    })}
                    placeholder="Username"
                    className="w-full px-4 py-2 bg-gray-800 text-white border border-gray-700 rounded focus:border-blue-500 outline-none"
                  />
                </label>
                <label className="block">
                  <span className="text-gray-300 mb-2 block">Password</span>
                  <input
                    type="password"
                    value={request.auth.password || ''}
                    onChange={(e) => updateRequest({
                      auth: { ...request.auth, password: e.target.value }
                    })}
                    placeholder="Password"
                    className="w-full px-4 py-2 bg-gray-800 text-white border border-gray-700 rounded focus:border-blue-500 outline-none"
                  />
                </label>
              </div>
            )}

            {request.auth.type === 'apikey' && (
              <div className="grid grid-cols-2 gap-4">
                <label className="block">
                  <span className="text-gray-300 mb-2 block">Key</span>
                  <input
                    type="text"
                    value={request.auth.key || ''}
                    onChange={(e) => updateRequest({
                      auth: { ...request.auth, key: e.target.value }
                    })}
                    placeholder="e.g. X-API-Key"
                    className="w-full px-4 py-2 bg-gray-800 text-white border border-gray-700 rounded focus:border-blue-500 outline-none"
                  />
                </label>
                <label className="block">
                  <span className="text-gray-300 mb-2 block">Value</span>
                  <input
                    type="text"
                    value={request.auth.value || ''}
                    onChange={(e) => updateRequest({
                      auth: { ...request.auth, value: e.target.value }
                    })}
                    placeholder="API key value"
                    className="w-full px-4 py-2 bg-gray-800 text-white border border-gray-700 rounded focus:border-blue-500 outline-none"
                  />
                </label>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}