import { useState } from 'react';
import { ApiRequest, ApiResponse, EnvironmentVariable } from '../types';

export function useApiRequest() {
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<ApiResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const replaceVariables = (text: string, variables: EnvironmentVariable[]): string => {
    let result = text;
    variables.forEach(variable => {
      if (variable.enabled) {
        const regex = new RegExp(`{{${variable.key}}}`, 'g');
        result = result.replace(regex, variable.value);
      }
    });
    return result;
  };

  const sendRequest = async (request: ApiRequest, environmentVariables: EnvironmentVariable[] = []) => {
    setLoading(true);
    setError(null);
    const startTime = Date.now();

    try {
      const url = replaceVariables(request.url, environmentVariables);
      const headers: Record<string, string> = {};

      // Add enabled headers
      request.headers.forEach(header => {
        if (header.enabled && header.key && header.value) {
          headers[header.key] = replaceVariables(header.value, environmentVariables);
        }
      });

      // Add authentication headers
      if (request.auth.type === 'bearer' && request.auth.token) {
        headers['Authorization'] = `Bearer ${replaceVariables(request.auth.token, environmentVariables)}`;
      } else if (request.auth.type === 'basic' && request.auth.username && request.auth.password) {
        const credentials = btoa(`${request.auth.username}:${request.auth.password}`);
        headers['Authorization'] = `Basic ${credentials}`;
      } else if (request.auth.type === 'apikey' && request.auth.key && request.auth.value) {
        headers[request.auth.key] = replaceVariables(request.auth.value, environmentVariables);
      }

      // Handle body
      let body: string | FormData | URLSearchParams | undefined;
      if (request.method !== 'GET' && request.method !== 'HEAD') {
        if (request.body.type === 'raw' && request.body.content) {
          body = replaceVariables(request.body.content, environmentVariables);
          if (request.body.rawType === 'json') {
            headers['Content-Type'] = 'application/json';
          }
        } else if (request.body.type === 'urlencoded' && request.body.content) {
          body = new URLSearchParams(replaceVariables(request.body.content, environmentVariables));
          headers['Content-Type'] = 'application/x-www-form-urlencoded';
        }
      }

      // Add query parameters
      const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
      request.params.forEach(param => {
        if (param.enabled && param.key && param.value) {
          urlObj.searchParams.append(param.key, replaceVariables(param.value, environmentVariables));
        }
      });

      const fetchResponse = await fetch(urlObj.toString(), {
        method: request.method,
        headers,
        body,
      });

      const responseHeaders: Record<string, string> = {};
      fetchResponse.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });

      const responseText = await fetchResponse.text();
      let responseData;
      
      try {
        responseData = JSON.parse(responseText);
      } catch {
        responseData = responseText;
      }

      const endTime = Date.now();
      const responseObj: ApiResponse = {
        status: fetchResponse.status,
        statusText: fetchResponse.statusText,
        headers: responseHeaders,
        data: responseData,
        time: endTime - startTime,
        size: new Blob([responseText]).size,
      };

      setResponse(responseObj);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return { sendRequest, loading, response, error };
}