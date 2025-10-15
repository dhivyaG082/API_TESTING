export interface ApiRequest {
  id: string;
  name: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';
  url: string;
  headers: Header[];
  params: Param[];
  body: {
    type: 'none' | 'raw' | 'form' | 'urlencoded';
    content: string;
    rawType: 'json' | 'text' | 'xml' | 'html';
  };
  auth: {
    type: 'none' | 'bearer' | 'basic' | 'apikey';
    token?: string;
    username?: string;
    password?: string;
    key?: string;
    value?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Collection {
  id: string;
  name: string;
  description: string;
  requests: ApiRequest[];
  createdAt: string;
  updatedAt: string;
}

export interface Environment {
  id: string;
  name: string;
  variables: EnvironmentVariable[];
  isActive: boolean;
}

export interface EnvironmentVariable {
  id: string;
  key: string;
  value: string;
  enabled: boolean;
}

export interface Header {
  id: string;
  key: string;
  value: string;
  enabled: boolean;
}

export interface Param {
  id: string;
  key: string;
  value: string;
  enabled: boolean;
}

export interface ApiResponse {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  data: any;
  time: number;
  size: number;
}

export interface Tab {
  id: string;
  name: string;
  type: 'request' | 'collection' | 'environment';
  requestId?: string;
  collectionId?: string;
  environmentId?: string;
  unsaved?: boolean;
}