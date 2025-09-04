"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FastAPIService } from '@/lib/fastapi-service';

export default function TestFastAPIPage() {
  const [files, setFiles] = useState<FileList | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFiles(e.target.files);
  };

  const handleUpload = async () => {
    if (!files || files.length === 0) {
      setError('Please select files to upload');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const fileArray = Array.from(files);
      const result = await FastAPIService.uploadFiles(fileArray);
      setSessionId(result.session_id);
      setAnswer(`Files uploaded successfully! Session ID: ${result.session_id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setLoading(false);
    }
  };

  const handleAsk = async () => {
    if (!question.trim()) {
      setError('Please enter a question');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await FastAPIService.askQuestion(question, sessionId || undefined);
      setAnswer(result.answer);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get answer');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>FastAPI Integration Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* File Upload Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">1. Upload Documents</h3>
            <div className="space-y-2">
              <Input
                type="file"
                multiple
                onChange={handleFileChange}
                accept=".pdf,.docx,.txt,.doc"
              />
              <Button 
                onClick={handleUpload} 
                disabled={loading || !files || files.length === 0}
                className="w-full"
              >
                {loading ? 'Uploading...' : 'Upload Files'}
              </Button>
            </div>
            {sessionId && (
              <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                <p className="text-sm text-green-700 dark:text-green-300">
                  ✅ Session ID: {sessionId}
                </p>
              </div>
            )}
          </div>

          {/* Question Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">2. Ask Questions</h3>
            <div className="space-y-2">
              <Input
                placeholder="Ask a question about your uploaded documents..."
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                disabled={!sessionId || loading}
              />
              <Button 
                onClick={handleAsk} 
                disabled={loading || !sessionId || !question.trim()}
                className="w-full"
              >
                {loading ? 'Asking...' : 'Ask Question'}
              </Button>
            </div>
          </div>

          {/* Results Section */}
          {(answer || error) && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">3. Results</h3>
              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-950/20 rounded-lg">
                  <p className="text-sm text-red-700 dark:text-red-300">
                    ❌ Error: {error}
                  </p>
                </div>
              )}
              {answer && (
                <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                  <p className="text-sm text-blue-700 dark:text-blue-300 whitespace-pre-wrap">
                    {answer}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Instructions */}
          <div className="p-4 bg-muted rounded-lg">
            <h4 className="font-semibold mb-2">Instructions:</h4>
            <ol className="text-sm space-y-1 list-decimal list-inside">
              <li>Upload one or more documents (PDF, DOCX, TXT, etc.)</li>
              <li>Wait for the upload to complete and get a session ID</li>
              <li>Ask questions about your uploaded documents</li>
              <li>The AI will use RAG to answer based on your documents</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
