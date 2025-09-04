/**
 * Service for interacting with FastAPI backend endpoints
 */

const FASTAPI_BASE_URL = process.env.NEXT_PUBLIC_FASTAPI_BASE_URL || 'http://localhost:8000';

export interface UploadResponse {
  message: string;
  session_id: string;
}

export interface AskResponse {
  answer: string;
  session_id: string;
}

export class FastAPIService {
  /**
   * Upload files to FastAPI backend
   */
  static async uploadFiles(files: File[]): Promise<UploadResponse> {
    const formData = new FormData();
    
    // Add files to form data
    files.forEach((file) => {
      formData.append('files', file);
    });

    const response = await fetch('/api/upload/fastapi', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to upload files');
    }

    return response.json();
  }

  /**
   * Ask a question using the uploaded documents
   */
  static async askQuestion(question: string, sessionId?: string): Promise<AskResponse> {
    const response = await fetch('/api/ask', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        question,
        session_id: sessionId,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to get response from backend');
    }

    return response.json();
  }

  /**
   * Check if FastAPI backend is available
   */
  static async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${FASTAPI_BASE_URL}/docs`, {
        method: 'GET',
        mode: 'no-cors', // Avoid CORS issues for health check
      });
      return true;
    } catch (error) {
      console.warn('FastAPI backend not available:', error);
      return false;
    }
  }
}
