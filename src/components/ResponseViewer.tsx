import React, { useState } from 'react';
import { Copy, Download, Code, Clock, Database } from 'lucide-react';
import { ApiResponse, ApiRequest, EnvironmentVariable } from '../types';
import { CodeGenerator } from '../utils/codeGeneration';

interface ResponseViewerProps {
  response: ApiResponse | null;
  error: string | null;
  loading: boolean;
  request: ApiRequest;
  environmentVariables: EnvironmentVariable[];
}

export function ResponseViewer({ response, error, loading, request, environmentVariables }: ResponseViewerProps) {
  const [activeTab, setActiveTab] = useState<'body' | 'headers' | 'code'>('body');
  const [codeLanguage, setCodeLanguage] = useState<'curl' | 'javascript' | 'python' | 'nodejs'>('curl');

  const getStatusColor = (status: number) => {
    if (status >= 200 && status < 300) return 'text-green-400 bg-green-900/20';
    if (status >= 300 && status < 400) return 'text-yellow-400 bg-yellow-900/20';
    if (status >= 400 && status < 500) return 'text-orange-400 bg-orange-900/20';
    return 'text-red-400 bg-red-900/20';
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatJson = (obj: any) => {
    try {
      return JSON.stringify(obj, null, 2);
    } catch {
      return obj?.toString() || '';
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const generateCode = () => {
    switch (codeLanguage) {
      case 'curl':
        return CodeGenerator.generateCurl(request, environmentVariables);
      case 'javascript':
        return CodeGenerator.generateJavaScriptFetch(request, environmentVariables);
      case 'python':
        return CodeGenerator.generatePythonRequests(request, environmentVariables);
      case 'nodejs':
        return CodeGenerator.generateNodeJsAxios(request, environmentVariables);
      default:
        return '';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Sending request...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-900">
        <div className="text-center max-w-md">
          <div className="text-red-400 text-6xl mb-4">⚠</div>
          <h3 className="text-white text-lg font-medium mb-2">Request Failed</h3>
          <p className="text-gray-400 mb-4">{error}</p>
          <div className="text-sm text-gray-500">
            Check your URL, network connection, or CORS settings
          </div>
        </div>
      </div>
    );
  }

  if (!response) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-900">
        <div className="text-center">
          <div className="text-gray-400 text-6xl mb-4">📡</div>
          <h3 className="text-white text-lg font-medium mb-2">Ready to Send</h3>
          <p className="text-gray-400">Configure your request and click Send to see the response</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-900">
      {/* Response Status Bar */}
      <div className="p-4 border-b border-gray-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className={`px-3 py-1 rounded-lg font-mono text-sm ${getStatusColor(response.status)}`}>
              {response.status} {response.statusText}
            </div>
            <div className="flex items-center space-x-4 text-gray-400 text-sm">
              <div className="flex items-center space-x-1">
                <Clock className="w-4 h-4" />
                <span>{response.time}ms</span>
              </div>
              <div className="flex items-center space-x-1">
                <Database className="w-4 h-4" />
                <span>{formatBytes(response.size)}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => copyToClipboard(formatJson(response.data))}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
              title="Copy response"
            >
              <Copy className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                const blob = new Blob([formatJson(response.data)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'response.json';
                a.click();
              }}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
              title="Download response"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-800">
        <nav className="flex space-x-8 px-4">
          {(['body', 'headers', 'code'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-3 px-1 border-b-2 font-medium text-sm capitalize flex items-center space-x-2 ${
                activeTab === tab
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-gray-400 hover:text-gray-300'
              }`}
            >
              {tab === 'code' && <Code className="w-4 h-4" />}
              <span>{tab}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'body' && (
          <div className="p-4">
            <pre className="bg-gray-800 text-gray-300 p-4 rounded-lg overflow-x-auto font-mono text-sm whitespace-pre-wrap">
              {formatJson(response.data)}
            </pre>
          </div>
        )}

        {activeTab === 'headers' && (
          <div className="p-4">
            <div className="space-y-2">
              {Object.entries(response.headers).map(([key, value]) => (
                <div key={key} className="flex items-start space-x-4 p-3 bg-gray-800 rounded-lg">
                  <div className="text-blue-400 font-medium font-mono text-sm min-w-0 flex-shrink-0">
                    {key}:
                  </div>
                  <div className="text-gray-300 font-mono text-sm flex-1 break-all">
                    {value}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'code' && (
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-4">
                <span className="text-white font-medium">Language:</span>
                <select
                  value={codeLanguage}
                  onChange={(e) => setCodeLanguage(e.target.value as any)}
                  className="px-3 py-2 bg-gray-800 text-white border border-gray-700 rounded focus:border-blue-500 outline-none"
                >
                  <option value="curl">cURL</option>
                  <option value="javascript">JavaScript (fetch)</option>
                  <option value="python">Python (requests)</option>
                  <option value="nodejs">Node.js (axios)</option>
                </select>
              </div>
              <button
                onClick={() => copyToClipboard(generateCode())}
                className="flex items-center space-x-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                <Copy className="w-4 h-4" />
                <span>Copy Code</span>
              </button>
            </div>
            <pre className="bg-gray-800 text-gray-300 p-4 rounded-lg overflow-x-auto font-mono text-sm whitespace-pre-wrap">
              {generateCode()}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}