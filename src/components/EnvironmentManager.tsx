import React, { useState } from 'react';
import { Plus, Trash2, Eye, EyeOff, Save } from 'lucide-react';
import { Environment, EnvironmentVariable } from '../types';

interface EnvironmentManagerProps {
  environments: Environment[];
  activeEnvironment: Environment | null;
  onUpdateEnvironments: (environments: Environment[]) => void;
  onSetActiveEnvironment: (environment: Environment | null) => void;
}

export function EnvironmentManager({
  environments,
  activeEnvironment,
  onUpdateEnvironments,
  onSetActiveEnvironment
}: EnvironmentManagerProps) {
  const [selectedEnvironmentId, setSelectedEnvironmentId] = useState<string>(
    activeEnvironment?.id || ''
  );
  const [editingEnvironment, setEditingEnvironment] = useState<Environment | null>(null);

  const selectedEnvironment = environments.find(env => env.id === selectedEnvironmentId);

  const addEnvironment = () => {
    const newEnvironment: Environment = {
      id: Date.now().toString(),
      name: 'New Environment',
      variables: [],
      isActive: false
    };
    setEditingEnvironment(newEnvironment);
  };

  const saveEnvironment = () => {
    if (!editingEnvironment) return;

    const isNewEnvironment = !environments.find(env => env.id === editingEnvironment.id);
    
    if (isNewEnvironment) {
      onUpdateEnvironments([...environments, editingEnvironment]);
    } else {
      onUpdateEnvironments(
        environments.map(env => 
          env.id === editingEnvironment.id ? editingEnvironment : env
        )
      );
    }
    
    setSelectedEnvironmentId(editingEnvironment.id);
    setEditingEnvironment(null);
  };

  const deleteEnvironment = (envId: string) => {
    onUpdateEnvironments(environments.filter(env => env.id !== envId));
    if (selectedEnvironmentId === envId) {
      setSelectedEnvironmentId('');
    }
    if (activeEnvironment?.id === envId) {
      onSetActiveEnvironment(null);
    }
  };

  const addVariable = (envToUpdate: Environment) => {
    const newVariable: EnvironmentVariable = {
      id: Date.now().toString(),
      key: '',
      value: '',
      enabled: true
    };
    
    const updatedEnvironment = {
      ...envToUpdate,
      variables: [...envToUpdate.variables, newVariable]
    };
    
    setEditingEnvironment(updatedEnvironment);
  };

  const updateVariable = (envToUpdate: Environment, variableId: string, updates: Partial<EnvironmentVariable>) => {
    const updatedEnvironment = {
      ...envToUpdate,
      variables: envToUpdate.variables.map(variable =>
        variable.id === variableId ? { ...variable, ...updates } : variable
      )
    };
    
    setEditingEnvironment(updatedEnvironment);
  };

  const removeVariable = (envToUpdate: Environment, variableId: string) => {
    const updatedEnvironment = {
      ...envToUpdate,
      variables: envToUpdate.variables.filter(variable => variable.id !== variableId)
    };
    
    setEditingEnvironment(updatedEnvironment);
  };

  const currentEnvironment = editingEnvironment || selectedEnvironment;

  return (
    <div className="flex flex-col h-full bg-gray-900">
      <div className="p-4 border-b border-gray-800">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white text-lg font-semibold">Environment Manager</h2>
          <button
            onClick={addEnvironment}
            className="flex items-center space-x-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>New Environment</span>
          </button>
        </div>

        <div className="flex items-center space-x-4">
          <select
            value={selectedEnvironmentId}
            onChange={(e) => setSelectedEnvironmentId(e.target.value)}
            className="flex-1 px-3 py-2 bg-gray-800 text-white border border-gray-700 rounded focus:border-blue-500 outline-none"
          >
            <option value="">Select Environment</option>
            {environments.map(env => (
              <option key={env.id} value={env.id}>
                {env.name} {env.id === activeEnvironment?.id ? '(Active)' : ''}
              </option>
            ))}
          </select>

          {selectedEnvironment && (
            <div className="flex space-x-2">
              <button
                onClick={() => setEditingEnvironment(selectedEnvironment)}
                className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors"
              >
                Edit
              </button>
              <button
                onClick={() => onSetActiveEnvironment(
                  selectedEnvironment.id === activeEnvironment?.id ? null : selectedEnvironment
                )}
                className={`px-3 py-2 rounded transition-colors ${
                  selectedEnvironment.id === activeEnvironment?.id
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'bg-green-600 hover:bg-green-700 text-white'
                }`}
              >
                {selectedEnvironment.id === activeEnvironment?.id ? 'Deactivate' : 'Activate'}
              </button>
              <button
                onClick={() => deleteEnvironment(selectedEnvironment.id)}
                className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
              >
                Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {currentEnvironment && (
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-4">
            <div>
              <label className="block text-white font-medium mb-2">Environment Name</label>
              <input
                type="text"
                value={currentEnvironment.name}
                onChange={(e) => {
                  if (editingEnvironment) {
                    setEditingEnvironment({ ...editingEnvironment, name: e.target.value });
                  }
                }}
                disabled={!editingEnvironment}
                className="w-full px-4 py-2 bg-gray-800 text-white border border-gray-700 rounded focus:border-blue-500 outline-none disabled:opacity-50"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-white font-medium">Variables</h3>
                {editingEnvironment && (
                  <button
                    onClick={() => addVariable(editingEnvironment)}
                    className="flex items-center space-x-2 text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Variable</span>
                  </button>
                )}
              </div>

              <div className="space-y-3">
                {currentEnvironment.variables.map((variable) => (
                  <div key={variable.id} className="flex items-center space-x-3 bg-gray-800 p-3 rounded-lg">
                    <button
                      onClick={() => {
                        if (editingEnvironment) {
                          updateVariable(editingEnvironment, variable.id, { enabled: !variable.enabled });
                        }
                      }}
                      disabled={!editingEnvironment}
                      className={`p-1 rounded ${variable.enabled ? 'text-green-400' : 'text-gray-400'} disabled:opacity-50`}
                    >
                      {variable.enabled ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>
                    <input
                      type="text"
                      value={variable.key}
                      onChange={(e) => {
                        if (editingEnvironment) {
                          updateVariable(editingEnvironment, variable.id, { key: e.target.value });
                        }
                      }}
                      placeholder="Variable name"
                      disabled={!editingEnvironment}
                      className="flex-1 px-3 py-2 bg-gray-700 text-white border border-gray-600 rounded focus:border-blue-500 outline-none disabled:opacity-50"
                    />
                    <input
                      type="text"
                      value={variable.value}
                      onChange={(e) => {
                        if (editingEnvironment) {
                          updateVariable(editingEnvironment, variable.id, { value: e.target.value });
                        }
                      }}
                      placeholder="Variable value"
                      disabled={!editingEnvironment}
                      className="flex-1 px-3 py-2 bg-gray-700 text-white border border-gray-600 rounded focus:border-blue-500 outline-none disabled:opacity-50"
                    />
                    {editingEnvironment && (
                      <button
                        onClick={() => removeVariable(editingEnvironment, variable.id)}
                        className="text-red-400 hover:text-red-300 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}

                {currentEnvironment.variables.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-gray-400">No variables defined</p>
                    {editingEnvironment && (
                      <button
                        onClick={() => addVariable(editingEnvironment)}
                        className="mt-2 text-blue-400 hover:text-blue-300 transition-colors"
                      >
                        Add your first variable
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {editingEnvironment && (
            <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-800">
              <button
                onClick={() => setEditingEnvironment(null)}
                className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveEnvironment}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                <Save className="w-4 h-4" />
                <span>Save Environment</span>
              </button>
            </div>
          )}
        </div>
      )}

      {!currentEnvironment && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Globe className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-white text-lg font-medium mb-2">No Environment Selected</h3>
            <p className="text-gray-400 mb-4">Create or select an environment to manage variables</p>
            <button
              onClick={addEnvironment}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Create Environment
            </button>
          </div>
        </div>
      )}
    </div>
  );
}