"use client";

import { useState, useEffect, Suspense } from "react";
import { Header } from "../components/Header";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

function DebugPageContent() {
  const [dbStatus, setDbStatus] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sessionDetails, setSessionDetails] = useState<any>(null);
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('id');
  
  useEffect(() => {
    async function checkDatabase() {
      try {
        const response = await fetch('/api/db-status');
        if (!response.ok) {
          throw new Error(`Status ${response.status}: ${response.statusText}`);
        }
        const data = await response.json();
        setDbStatus(data);
        setIsLoading(false);
      } catch (err) {
        setError(`Error checking database: ${err instanceof Error ? err.message : String(err)}`);
        setIsLoading(false);
      }
    }
    
    checkDatabase();
  }, []);
  
  useEffect(() => {
    // If we have a session ID, try to load it from session storage
    if (sessionId) {
      try {
        const historyJson = sessionStorage.getItem('interviewHistory');
        if (historyJson) {
          const history = JSON.parse(historyJson);
          const session = history.find((item: any) => item.id === sessionId);
          
          if (session) {
            setSessionDetails(session);
          }
        }
      } catch (e) {
        console.error('Error loading session details:', e);
      }
    }
  }, [sessionId]);
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          {sessionId ? 'Session Details' : 'Database Status'}
        </h1>
        
        {sessionId && sessionDetails ? (
          <div className="space-y-6">
            <div className="bg-indigo-50 p-6 rounded-lg">
              <h2 className="text-lg font-semibold text-indigo-900 mb-2">Session Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <span className="block text-sm font-medium text-gray-700">Session ID</span>
                  <span className="block text-gray-900">{sessionDetails.id}</span>
                </div>
                <div>
                  <span className="block text-sm font-medium text-gray-700">Type</span>
                  <span className="block text-gray-900 capitalize">{sessionDetails.type}</span>
                </div>
                <div>
                  <span className="block text-sm font-medium text-gray-700">Topic</span>
                  <span className="block text-gray-900">{sessionDetails.topic}</span>
                </div>
                <div>
                  <span className="block text-sm font-medium text-gray-700">Date</span>
                  <span className="block text-gray-900">{new Date(sessionDetails.date).toLocaleString()}</span>
                </div>
              </div>
            </div>
            
            {sessionDetails.feedback && (
              <div className="bg-green-50 p-6 rounded-lg">
                <h2 className="text-lg font-semibold text-green-900 mb-4">Session Feedback</h2>
                
                <div className="mb-4">
                  <h3 className="font-medium text-gray-900 mb-1">Summary</h3>
                  <p className="text-gray-800">{sessionDetails.feedback.summary}</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Strengths</h3>
                    <ul className="list-disc pl-5 space-y-1">
                      {sessionDetails.feedback.strengths.map((item: string, i: number) => (
                        <li key={i} className="text-gray-800">{item}</li>
                      ))}
                    </ul>
                  </div>
                  
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Areas for Improvement</h3>
                    <ul className="list-disc pl-5 space-y-1">
                      {sessionDetails.feedback.improvements.map((item: string, i: number) => (
                        <li key={i} className="text-gray-800">{item}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
            
            <div className="flex justify-between">
              <button 
                onClick={() => {
                  const historyJson = sessionStorage.getItem('interviewHistory');
                  if (historyJson) {
                    try {
                      const history = JSON.parse(historyJson);
                      console.log('Full session history:', history);
                      alert('Check browser console for full session data');
                    } catch (e) {
                      console.error('Error parsing history:', e);
                    }
                  }
                }}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
              >
                Debug Session Data
              </button>
              
              <Link
                href="/dashboard"
                className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
              >
                Back to Dashboard
              </Link>
            </div>
          </div>
        ) : isLoading ? (
          <div className="p-12 flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        ) : error ? (
          <div className="p-6 bg-red-50 text-red-700 rounded-lg">
            <p>{error}</p>
            <Link
              href="/dashboard"
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded inline-block hover:bg-red-700"
            >
              Back to Dashboard
            </Link>
          </div>
        ) : (
          <div>
            <div className="bg-green-50 p-4 rounded-lg mb-6">
              <p className="text-green-800">
                Database Status: {dbStatus?.status}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                Storage Type: {dbStatus?.storage}
              </p>
              <p className="text-sm text-gray-600">
                Total Interviews: {dbStatus?.interviewCount || 0}
              </p>
            </div>
            
            {dbStatus?.interviewCount > 0 && (
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-900">Sample Data</h2>
                </div>
                <div className="p-6">
                  <pre className="bg-gray-50 p-4 rounded text-sm overflow-auto max-h-64">
                    {JSON.stringify(dbStatus?.sampleData, null, 2)}
                  </pre>
                </div>
              </div>
            )}
            
            <div className="p-6 bg-blue-50 rounded-lg border border-blue-100">
              <h3 className="text-lg font-medium text-blue-800 mb-2">Session Storage</h3>
              <div className="space-y-4">
                <div>
                  <button 
                    onClick={() => {
                      const historyJson = sessionStorage.getItem('interviewHistory');
                      alert(historyJson ? `Interview History: ${historyJson}` : 'No interview history found');
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Check Session Storage
                  </button>
                </div>
                
                <div>
                  <Link 
                    href="/dashboard"
                    className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 inline-block"
                  >
                    Back to Dashboard
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function DebugPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <Header />
      <Suspense fallback={
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-sm p-6 flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        </div>
      }>
        <DebugPageContent />
      </Suspense>
    </main>
  );
} 