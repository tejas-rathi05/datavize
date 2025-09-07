/**
 * Service for interacting with OpenRouter API
 */

export interface OpenRouterMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface OpenRouterRequest {
  messages: OpenRouterMessage[];
  model: string;
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
  files?: OpenRouterFile[];
}

export interface OpenRouterFile {
  name: string;
  type: string;
  size: number;
  data: string; // base64 encoded
}

export interface OpenRouterResponse {
  content: string;
  model: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  files?: Array<{
    name: string;
    type: string;
    size: number;
  }>;
}

export interface OpenRouterStreamResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    delta: {
      content?: string;
    };
    finish_reason?: string;
  }>;
}

export class OpenRouterService {
  /**
   * Send a chat message to OpenRouter
   */
  static async sendMessage(
    messages: OpenRouterMessage[],
    model: string = 'gpt-4o',
    files: File[] = [],
    options: {
      temperature?: number;
      max_tokens?: number;
      stream?: boolean;
    } = {}
  ): Promise<OpenRouterResponse> {
    const processedFiles: OpenRouterFile[] = [];
    
    // Process files if any
    if (files.length > 0) {
      for (const file of files) {
        const buffer = await file.arrayBuffer();
        processedFiles.push({
          name: file.name,
          type: file.type,
          size: file.size,
          data: Buffer.from(buffer).toString('base64')
        });
      }
    }

    const requestBody: OpenRouterRequest = {
      messages,
      model,
      temperature: options.temperature || 0.7,
      max_tokens: options.max_tokens || 4000,
      stream: options.stream || false,
      files: processedFiles.length > 0 ? processedFiles : undefined,
    };

    const response = await fetch('/api/chat/openrouter', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Send a streaming chat message to OpenRouter
   */
  static async sendStreamingMessage(
    messages: OpenRouterMessage[],
    model: string = 'gpt-4o',
    files: File[] = [],
    onChunk: (content: string) => void,
    options: {
      temperature?: number;
      max_tokens?: number;
    } = {}
  ): Promise<void> {
    const processedFiles: OpenRouterFile[] = [];
    
    // Process files if any
    if (files.length > 0) {
      for (const file of files) {
        const buffer = await file.arrayBuffer();
        processedFiles.push({
          name: file.name,
          type: file.type,
          size: file.size,
          data: Buffer.from(buffer).toString('base64')
        });
      }
    }

    const requestBody: OpenRouterRequest = {
      messages,
      model,
      temperature: options.temperature || 0.7,
      max_tokens: options.max_tokens || 4000,
      stream: true,
      files: processedFiles.length > 0 ? processedFiles : undefined,
    };

    const response = await fetch('/api/chat/openrouter', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    if (!response.body) {
      throw new Error('No response body for streaming');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    try {
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            
            if (data === '[DONE]') {
              return;
            }

            try {
              const parsed: OpenRouterStreamResponse = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content;
              
              if (content) {
                onChunk(content);
              }
            } catch (e) {
              // Ignore parsing errors for malformed chunks
              console.warn('Failed to parse streaming chunk:', e);
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  /**
   * Get available models from OpenRouter
   */
  static getAvailableModels(): string[] {
    return [
      'gpt-4o',
      'gpt-4o-mini',
      'gpt-4-turbo',
      'gpt-3.5-turbo',
      'claude-3-5-sonnet-20241022',
      'claude-3-5-haiku-20241022',
      'claude-3-opus-20240229',
      'claude-3-sonnet-20240229',
      'claude-3-haiku-20240307',
      'gemini-pro-1.5',
      'llama-3.1-405b-instruct',
      'llama-3.1-70b-instruct',
      'llama-3.1-8b-instruct',
    ];
  }

  /**
   * Get model display name
   */
  static getModelDisplayName(model: string): string {
    const modelNames: { [key: string]: string } = {
      'gpt-4o': 'GPT-4o',
      'gpt-4o-mini': 'GPT-4o Mini',
      'gpt-4-turbo': 'GPT-4 Turbo',
      'gpt-3.5-turbo': 'GPT-3.5 Turbo',
      'claude-3-5-sonnet-20241022': 'Claude 3.5 Sonnet',
      'claude-3-5-haiku-20241022': 'Claude 3.5 Haiku',
      'claude-3-opus-20240229': 'Claude 3 Opus',
      'claude-3-sonnet-20240229': 'Claude 3 Sonnet',
      'claude-3-haiku-20240307': 'Claude 3 Haiku',
      'gemini-pro-1.5': 'Gemini Pro 1.5',
      'llama-3.1-405b-instruct': 'Llama 3.1 405B',
      'llama-3.1-70b-instruct': 'Llama 3.1 70B',
      'llama-3.1-8b-instruct': 'Llama 3.1 8B',
    };
    return modelNames[model] || model;
  }

  /**
   * Get model category
   */
  static getModelCategory(model: string): string {
    if (model.startsWith('gpt-')) return 'OpenAI';
    if (model.startsWith('claude-')) return 'Anthropic';
    if (model.startsWith('gemini-')) return 'Google';
    if (model.startsWith('llama-')) return 'Meta';
    return 'Other';
  }

  /**
   * Check if model supports file uploads
   */
  static supportsFileUploads(model: string): boolean {
    const fileSupportModels = [
      'gpt-4o',
      'gpt-4o-mini',
      'gpt-4-turbo',
      'claude-3-5-sonnet-20241022',
      'claude-3-5-haiku-20241022',
      'claude-3-opus-20240229',
      'claude-3-sonnet-20240229',
    ];
    return fileSupportModels.includes(model);
  }
}

