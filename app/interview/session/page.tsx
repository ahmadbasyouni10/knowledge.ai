"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MockInterviewSession } from "../../components/MockInterviewSession";
import { Header } from "../../components/Header";
import { SessionHistoryManager } from "../../components/SessionHistoryManager";

export default function InterviewSessionPage() {
  const router = useRouter();
  const [feedback, setFeedback] = useState<null | {
    summary: string;
    strengths: string[];
    improvements: string[];
  }>(null);
  const [sessionData, setSessionData] = useState<any>(null);
  
  useEffect(() => {
    // Get session data from sessionStorage for SessionHistoryManager
    try {
      const data = JSON.parse(sessionStorage.getItem('interviewSession') || '{}');
      if (data && data.id) {
        setSessionData(data);
      }
    } catch (error) {
      console.error("Error parsing session data:", error);
    }
  }, []);
  
  const handleSessionComplete = (result: any) => {
    setFeedback(result);
  };
  
  // If we have feedback, show the feedback screen
  if (feedback) {
    return (
      <main className="min-h-screen bg-gray-50 flex flex-col">
        <Header showBackButton backHref="/dashboard" />
        
        <div className="flex-1 container mx-auto px-4 py-8 flex flex-col items-center">
          <div className="max-w-3xl w-full bg-white rounded-xl shadow-md overflow-hidden">
            <div className="p-6 border-b">
              <h1 className="text-2xl font-bold text-gray-900">Session Complete</h1>
              <p className="text-gray-600">Here's your feedback</p>
            </div>
            
            <div className="p-6">
              <div className="mb-6">
                <h2 className="text-lg font-medium text-gray-900 mb-2">Summary</h2>
                <p className="text-gray-700">{feedback.summary}</p>
              </div>
              
              <div className="mb-6">
                <h2 className="text-lg font-medium text-gray-900 mb-2">Strengths</h2>
                <ul className="list-disc pl-5 space-y-1">
                  {feedback.strengths.map((strength, i) => (
                    <li key={i} className="text-gray-700">{strength}</li>
                  ))}
                </ul>
              </div>
              
              <div>
                <h2 className="text-lg font-medium text-gray-900 mb-2">Areas for Improvement</h2>
                <ul className="list-disc pl-5 space-y-1">
                  {feedback.improvements.map((improvement, i) => (
                    <li key={i} className="text-gray-700">{improvement}</li>
                  ))}
                </ul>
              </div>
            </div>
            
            <div className="p-6 bg-gray-50 flex justify-end">
              <button
                onClick={() => router.push("/dashboard")}
                className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors"
              >
                Return to Dashboard
              </button>
            </div>
          </div>
        </div>
      </main>
    );
  }
  
  // Show the interview session
  return (
    <main className="min-h-screen flex flex-col">
      {sessionData && (
        <SessionHistoryManager 
          interviewId={sessionData.id}
          type={sessionData.type}
          topic={sessionData.topic}
        />
      )}
      <MockInterviewSession onComplete={handleSessionComplete} />
    </main>
  );
} 