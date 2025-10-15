import { ApiRequest, EnvironmentVariable } from '../types';

export class CodeGenerator {
  private static replaceVariables(text: string, variables: EnvironmentVariable[]): string {
    let result = text;
    variables.forEach(variable => {
      if (variable.enabled) {
        const regex = new RegExp(`{{${variable.key}}}`, 'g');
        result = result.replace(regex, variable.value);
      }
    });
    return result;
  }

  static generateCurl(request: ApiRequest, variables: EnvironmentVariable[] = []): string {
    const url = this.replaceVariables(request.url, variables);
    let curl = `curl -X ${request.method}`;
    
    // Add headers
    request.headers.forEach(header => {
      if (header.enabled && header.key && header.value) {
        const value = this.replaceVariables(header.value, variables);
        curl += ` \\\n  -H "${header.key}: ${value}"`;
      }
    });

    // Add auth
    if (request.auth.type === 'bearer' && request.auth.token) {
      const token = this.replaceVariables(request.auth.token, variables);
      curl += ` \\\n  -H "Authorization: Bearer ${token}"`;
    } else if (request.auth.type === 'basic' && request.auth.username && request.auth.password) {
      curl += ` \\\n  -u "${request.auth.username}:${request.auth.password}"`;
    }

    // Add body
    if (request.body.type === 'raw' && request.body.content) {
      const body = this.replaceVariables(request.body.content, variables);
      curl += ` \\\n  -d '${body}'`;
    }

    // Add URL with params
    const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
    request.params.forEach(param => {
      if (param.enabled && param.key && param.value) {
        urlObj.searchParams.append(param.key, this.replaceVariables(param.value, variables));
      }
    });

    curl += ` \\\n  "${urlObj.toString()}"`;
    
    return curl;
  }

  static generateJavaScriptFetch(request: ApiRequest, variables: EnvironmentVariable[] = []): string {
    const url = this.replaceVariables(request.url, variables);
    const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
    
    request.params.forEach(param => {
      if (param.enabled && param.key && param.value) {
        urlObj.searchParams.append(param.key, this.replaceVariables(param.value, variables));
      }
    });

    let code = `const response = await fetch("${urlObj.toString()}", {\n`;
    code += `  method: "${request.method}",\n`;
    
    // Headers
    const headers: string[] = [];
    request.headers.forEach(header => {
      if (header.enabled && header.key && header.value) {
        const value = this.replaceVariables(header.value, variables);
        headers.push(`    "${header.key}": "${value}"`);
      }
    });

    if (request.auth.type === 'bearer' && request.auth.token) {
      const token = this.replaceVariables(request.auth.token, variables);
      headers.push(`    "Authorization": "Bearer ${token}"`);
    }

    if (request.body.type === 'raw' && request.body.rawType === 'json') {
      headers.push(`    "Content-Type": "application/json"`);
    }

    if (headers.length > 0) {
      code += `  headers: {\n${headers.join(',\n')}\n  },\n`;
    }

    // Body
    if (request.body.type === 'raw' && request.body.content) {
      const body = this.replaceVariables(request.body.content, variables);
      code += `  body: ${request.body.rawType === 'json' ? body : `"${body}"`}\n`;
    }

    code += `});\n\nconst data = await response.json();`;
    
    return code;
  }

  static generatePythonRequests(request: ApiRequest, variables: EnvironmentVariable[] = []): string {
    const url = this.replaceVariables(request.url, variables);
    let code = `import requests\n\n`;
    
    // URL with params
    const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
    const params: string[] = [];
    request.params.forEach(param => {
      if (param.enabled && param.key && param.value) {
        params.push(`    "${param.key}": "${this.replaceVariables(param.value, variables)}"`);
      }
    });

    // Headers
    const headers: string[] = [];
    request.headers.forEach(header => {
      if (header.enabled && header.key && header.value) {
        const value = this.replaceVariables(header.value, variables);
        headers.push(`    "${header.key}": "${value}"`);
      }
    });

    if (request.auth.type === 'bearer' && request.auth.token) {
      const token = this.replaceVariables(request.auth.token, variables);
      headers.push(`    "Authorization": "Bearer ${token}"`);
    }

    code += `url = "${urlObj.origin}${urlObj.pathname}"\n\n`;
    
    if (params.length > 0) {
      code += `params = {\n${params.join(',\n')}\n}\n\n`;
    }

    if (headers.length > 0) {
      code += `headers = {\n${headers.join(',\n')}\n}\n\n`;
    }

    if (request.body.type === 'raw' && request.body.content) {
      const body = this.replaceVariables(request.body.content, variables);
      code += `data = ${request.body.rawType === 'json' ? body : `"${body}"`}\n\n`;
    }

    code += `response = requests.${request.method.toLowerCase()}(url`;
    
    if (params.length > 0) code += `, params=params`;
    if (headers.length > 0) code += `, headers=headers`;
    if (request.body.type === 'raw' && request.body.content) {
      code += request.body.rawType === 'json' ? `, json=data` : `, data=data`;
    }
    
    code += `)\n\nprint(response.json())`;
    
    return code;
  }

  static generateNodeJsAxios(request: ApiRequest, variables: EnvironmentVariable[] = []): string {
    const url = this.replaceVariables(request.url, variables);
    let code = `const axios = require('axios');\n\n`;
    
    const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
    request.params.forEach(param => {
      if (param.enabled && param.key && param.value) {
        urlObj.searchParams.append(param.key, this.replaceVariables(param.value, variables));
      }
    });

    code += `const config = {\n`;
    code += `  method: '${request.method.toLowerCase()}',\n`;
    code += `  url: '${urlObj.toString()}',\n`;
    
    // Headers
    const headers: string[] = [];
    request.headers.forEach(header => {
      if (header.enabled && header.key && header.value) {
        const value = this.replaceVariables(header.value, variables);
        headers.push(`    '${header.key}': '${value}'`);
      }
    });

    if (request.auth.type === 'bearer' && request.auth.token) {
      const token = this.replaceVariables(request.auth.token, variables);
      headers.push(`    'Authorization': 'Bearer ${token}'`);
    }

    if (headers.length > 0) {
      code += `  headers: {\n${headers.join(',\n')}\n  },\n`;
    }

    if (request.body.type === 'raw' && request.body.content) {
      const body = this.replaceVariables(request.body.content, variables);
      code += `  data: ${request.body.rawType === 'json' ? body : `'${body}'`}\n`;
    }

    code += `};\n\naxios(config)\n  .then(response => {\n    console.log(response.data);\n  })\n  .catch(error => {\n    console.error(error);\n  });`;
    
    return code;
  }
}