import { useState, useEffect, useRef } from "react";
import { InterviewSession } from "./InterviewSession";

// Props for the mock interview session
interface MockInterviewSessionProps {
  onComplete: (feedback: any) => void;
}

export function MockInterviewSession({ onComplete }: MockInterviewSessionProps) {
  const [sessionData, setSessionData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Get session data from sessionStorage
    try {
      const data = JSON.parse(sessionStorage.getItem('interviewSession') || '{}');
      
      if (data && data.topic) {
        setSessionData(data);
      } else {
        console.error("No valid session data found");
      }
    } catch (error) {
      console.error("Error parsing session data:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  if (isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-indigo-800">Loading your interview session...</p>
        </div>
      </div>
    );
  }

  if (!sessionData || !sessionData.topic) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-lg max-w-md">
          <h3 className="font-medium text-lg mb-2">Session Error</h3>
          <p>We couldn't find your interview session data.</p>
          <button 
            onClick={() => window.location.href = "/dashboard"}
            className="mt-4 bg-red-100 text-red-800 px-4 py-2 rounded hover:bg-red-200"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <InterviewSession
      topic={sessionData.topic}
      sessionType={sessionData.type}
      details={sessionData.details}
      notes={sessionData.notes}
      onEnd={(feedback) => {
        // Add feedback to session history in local storage
        try {
          const historyJson = sessionStorage.getItem('interviewHistory') || '[]';
          const history = JSON.parse(historyJson);
          
          // Find the current session in history and update it
          const sessionIndex = history.findIndex((item: any) => item.id === sessionData.id);
          
          if (sessionIndex !== -1) {
            history[sessionIndex].feedback = feedback;
            sessionStorage.setItem('interviewHistory', JSON.stringify(history));
          }
        } catch (e) {
          console.error('Error updating session history with feedback:', e);
        }
        
        onComplete(feedback);
      }}
      className="h-[calc(100vh-64px)]"
    />
  );
} 