import React, { useState, useCallback, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { TabManager } from './components/TabManager';
import { RequestEditor } from './components/RequestEditor';
import { ResponseViewer } from './components/ResponseViewer';
import { EnvironmentManager } from './components/EnvironmentManager';
import { useLocalStorage } from './hooks/useLocalStorage';
import { useApiRequest } from './hooks/useApiRequest';
import { 
  Collection, 
  ApiRequest, 
  Environment, 
  Tab,
  Header,
  Param 
} from './types';

function App() {
  const [collections, setCollections] = useLocalStorage<Collection[]>('api-studio-collections', []);
  const [environments, setEnvironments] = useLocalStorage<Environment[]>('api-studio-environments', []);
  const [activeEnvironment, setActiveEnvironment] = useLocalStorage<Environment | null>('api-studio-active-env', null);
  const [tabs, setTabs] = useState<Tab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string>('');
  const [currentRequest, setCurrentRequest] = useState<ApiRequest | null>(null);
  const [currentCollectionId, setCurrentCollectionId] = useState<string>('');

  const { sendRequest, loading, response, error } = useApiRequest();

  // Initialize with a default tab
  useEffect(() => {
    if (tabs.length === 0) {
      createNewRequestTab();
    }
  }, []);

  const createNewRequestTab = () => {
    const newRequest: ApiRequest = {
      id: Date.now().toString(),
      name: 'Untitled Request',
      method: 'GET',
      url: '',
      headers: [],
      params: [],
      body: {
        type: 'none',
        content: '',
        rawType: 'json'
      },
      auth: {
        type: 'none'
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const newTab: Tab = {
      id: newRequest.id,
      name: newRequest.name,
      type: 'request',
      requestId: newRequest.id,
      unsaved: true
    };

    setTabs(prev => [...prev, newTab]);
    setActiveTabId(newTab.id);
    setCurrentRequest(newRequest);
    setCurrentCollectionId('');
  };

  const createCollection = () => {
    const newCollection: Collection = {
      id: Date.now().toString(),
      name: 'New Collection',
      description: '',
      requests: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setCollections(prev => [...prev, newCollection]);
  };

  const createEnvironment = () => {
    const newEnvironment: Environment = {
      id: Date.now().toString(),
      name: 'New Environment',
      variables: [],
      isActive: false
    };

    setEnvironments(prev => [...prev, newEnvironment]);
  };

  const saveCurrentRequest = () => {
    if (!currentRequest) return;

    const activeTab = tabs.find(tab => tab.id === activeTabId);
    if (!activeTab) return;

    if (currentCollectionId) {
      // Update existing request in collection
      setCollections(prev => prev.map(collection => {
        if (collection.id === currentCollectionId) {
          return {
            ...collection,
            requests: collection.requests.map(req => 
              req.id === currentRequest.id ? currentRequest : req
            ),
            updatedAt: new Date().toISOString()
          };
        }
        return collection;
      }));
    } else {
      // Create new collection for unsaved request
      const newCollection: Collection = {
        id: Date.now().toString(),
        name: 'My Requests',
        description: '',
        requests: [currentRequest],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      setCollections(prev => {
        const existingCollection = prev.find(col => col.name === 'My Requests');
        if (existingCollection) {
          return prev.map(col => 
            col.id === existingCollection.id 
              ? { ...col, requests: [...col.requests, currentRequest] }
              : col
          );
        }
        return [...prev, newCollection];
      });

      setCurrentCollectionId(newCollection.id);
    }

    // Mark tab as saved
    setTabs(prev => prev.map(tab => 
      tab.id === activeTabId ? { ...tab, unsaved: false } : tab
    ));
  };

  const handleRequestSelect = (request: ApiRequest, collectionId: string) => {
    // Check if tab already exists
    const existingTab = tabs.find(tab => tab.requestId === request.id);
    
    if (existingTab) {
      setActiveTabId(existingTab.id);
    } else {
      const newTab: Tab = {
        id: `${request.id}-${Date.now()}`,
        name: request.name,
        type: 'request',
        requestId: request.id
      };

      setTabs(prev => [...prev, newTab]);
      setActiveTabId(newTab.id);
    }

    setCurrentRequest(request);
    setCurrentCollectionId(collectionId);
  };

  const handleTabClose = (tabId: string) => {
    const newTabs = tabs.filter(tab => tab.id !== tabId);
    setTabs(newTabs);

    if (activeTabId === tabId) {
      if (newTabs.length > 0) {
        const newActiveTab = newTabs[newTabs.length - 1];
        setActiveTabId(newActiveTab.id);
        
        if (newActiveTab.type === 'request' && newActiveTab.requestId) {
          // Find the request in collections
          const foundRequest = collections
            .flatMap(col => col.requests.map(req => ({ req, collectionId: col.id })))
            .find(({ req }) => req.id === newActiveTab.requestId);
          
          if (foundRequest) {
            setCurrentRequest(foundRequest.req);
            setCurrentCollectionId(foundRequest.collectionId);
          }
        }
      } else {
        createNewRequestTab();
      }
    }
  };

  const handleEnvironmentManagement = () => {
    const envTab: Tab = {
      id: 'environment-manager',
      name: 'Environments',
      type: 'environment'
    };

    const existingTab = tabs.find(tab => tab.id === envTab.id);
    if (!existingTab) {
      setTabs(prev => [...prev, envTab]);
    }
    setActiveTabId(envTab.id);
  };

  const handleSendRequest = async () => {
    if (!currentRequest) return;
    
    saveCurrentRequest();
    await sendRequest(currentRequest, activeEnvironment?.variables || []);
  };

  const handleUpdateRequest = (updatedRequest: ApiRequest) => {
    setCurrentRequest(updatedRequest);
    
    // Mark tab as unsaved if it's not already
    setTabs(prev => prev.map(tab => 
      tab.id === activeTabId ? { 
        ...tab, 
        unsaved: true,
        name: updatedRequest.name 
      } : tab
    ));
  };

  const activeTab = tabs.find(tab => tab.id === activeTabId);
  const showRequestEditor = activeTab?.type === 'request';
  const showEnvironmentManager = activeTab?.type === 'environment';

  return (
    <div className="flex h-screen bg-gray-900 text-white">
      {/* Sidebar */}
      <Sidebar
        collections={collections}
        environments={environments}
        activeEnvironment={activeEnvironment}
        onCreateCollection={createCollection}
        onCreateRequest={createNewRequestTab}
        onCreateEnvironment={createEnvironment}
        onSelectRequest={handleRequestSelect}
        onSelectEnvironment={(env) => {
          setActiveEnvironment(env);
          setEnvironments(prev => prev.map(e => ({ ...e, isActive: e.id === env.id })));
        }}
        onDeleteCollection={(collectionId) => {
          setCollections(prev => prev.filter(col => col.id !== collectionId));
        }}
        onDeleteRequest={(requestId, collectionId) => {
          setCollections(prev => prev.map(col => 
            col.id === collectionId 
              ? { ...col, requests: col.requests.filter(req => req.id !== requestId) }
              : col
          ));
          
          // Close tab if open
          const requestTab = tabs.find(tab => tab.requestId === requestId);
          if (requestTab) {
            handleTabClose(requestTab.id);
          }
        }}
        className="w-80 flex-shrink-0"
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Tabs */}
        <TabManager
          tabs={tabs}
          activeTabId={activeTabId}
          onTabSelect={setActiveTabId}
          onTabClose={handleTabClose}
          onNewTab={createNewRequestTab}
        />

        {/* Content Area */}
        <div className="flex-1 flex min-h-0">
          {showEnvironmentManager && (
            <EnvironmentManager
              environments={environments}
              activeEnvironment={activeEnvironment}
              onUpdateEnvironments={setEnvironments}
              onSetActiveEnvironment={setActiveEnvironment}
            />
          )}

          {showRequestEditor && currentRequest && (
            <>
              {/* Request Editor */}
              <div className="flex-1 border-r border-gray-800">
                <RequestEditor
                  request={currentRequest}
                  environmentVariables={activeEnvironment?.variables || []}
                  onUpdateRequest={handleUpdateRequest}
                  onSendRequest={handleSendRequest}
                  loading={loading}
                />
              </div>

              {/* Response Viewer */}
              <div className="flex-1">
                <ResponseViewer
                  response={response}
                  error={error}
                  loading={loading}
                  request={currentRequest}
                  environmentVariables={activeEnvironment?.variables || []}
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Environment Quick Access */}
      {activeEnvironment && (
        <div className="fixed bottom-4 right-4">
          <button
            onClick={handleEnvironmentManagement}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow-lg transition-colors flex items-center space-x-2"
          >
            <span className="w-2 h-2 bg-green-400 rounded-full"></span>
            <span>{activeEnvironment.name}</span>
          </button>
        </div>
      )}
    </div>
  );
}

export default App;