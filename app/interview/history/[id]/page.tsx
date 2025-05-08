"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Header } from "../../../components/Header";
import { CodeBracketIcon, AcademicCapIcon, ChatBubbleLeftRightIcon } from "@heroicons/react/24/outline";

interface HistoryMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

interface SessionFeedback {
  summary: string;
  strengths: string[];
  improvements: string[];
}

interface SessionData {
  id: string;
  type: string;
  topic: string;
  date: string;
  messages?: HistoryMessage[];
  feedback?: SessionFeedback;
}

export default function InterviewHistoryPage() {
  const params = useParams();
  const router = useRouter();
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    // Fetch session data from session storage
    const fetchSessionData = () => {
      try {
        const id = params.id;
        if (!id) {
          console.error("No session ID provided");
          setIsLoading(false);
          return;
        }
        
        const historyJson = sessionStorage.getItem('interviewHistory');
        if (!historyJson) {
          console.error("No interview history found");
          setIsLoading(false);
          return;
        }
        
        const history = JSON.parse(historyJson);
        const session = history.find((s: SessionData) => s.id === id);
        
        if (session) {
          setSessionData(session);
        } else {
          console.error(`Session with ID ${id} not found`);
        }
      } catch (e) {
        console.error('Error fetching session data:', e);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchSessionData();
  }, [params.id]);
  
  // Function to get icon based on session type
  const getSessionIcon = () => {
    if (!sessionData) return null;
    
    if (sessionData.type === "mock") {
      return <CodeBracketIcon className="w-6 h-6 text-indigo-600" />;
    } else if (sessionData.type === "topic") {
      return <AcademicCapIcon className="w-6 h-6 text-amber-600" />;
    } else {
      return <ChatBubbleLeftRightIcon className="w-6 h-6 text-green-600" />;
    }
  };
  
  // Function to get formatted session type name
  const getSessionTypeName = () => {
    if (!sessionData) return "";
    
    if (sessionData.type === "mock") {
      return "Mock Interview";
    } else if (sessionData.type === "topic") {
      return "Topic Lecture";
    } else {
      return "Session";
    }
  };
  
  if (isLoading) {
    return (
      <main className="min-h-screen bg-gray-50">
        <Header showBackButton backHref="/dashboard" />
        
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse flex flex-col space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-64 bg-gray-200 rounded w-full mt-8"></div>
          </div>
        </div>
      </main>
    );
  }
  
  if (!sessionData) {
    return (
      <main className="min-h-screen bg-gray-50">
        <Header showBackButton backHref="/dashboard" />
        
        <div className="container mx-auto px-4 py-8">
          <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-lg">
            <h3 className="font-medium text-lg mb-2">Session Not Found</h3>
            <p>We couldn't find the interview session you're looking for.</p>
            <button 
              onClick={() => router.push("/dashboard")}
              className="mt-4 bg-red-100 text-red-800 px-4 py-2 rounded hover:bg-red-200"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      </main>
    );
  }
  
  return (
    <main className="min-h-screen bg-gray-50">
      <Header showBackButton backHref="/dashboard" />
      
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          {/* Session header */}
          <div className="border-b p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-50 rounded-full">
                {getSessionIcon()}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{sessionData.topic}</h1>
                <p className="text-gray-600">
                  {new Date(sessionData.date).toLocaleDateString()} - {getSessionTypeName()}
                </p>
              </div>
            </div>
          </div>
          
          {/* Session conversation */}
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Conversation</h2>
            
            {sessionData.messages && sessionData.messages.length > 0 ? (
              <div className="space-y-4">
                {sessionData.messages.map((message) => (
                  <div 
                    key={message.id}
                    className={`flex ${message.role === "assistant" ? "justify-start" : "justify-end"}`}
                  >
                    <div 
                      className={`max-w-3xl rounded-lg px-4 py-2 ${
                        message.role === "assistant" 
                          ? "bg-gray-100 text-gray-800" 
                          : "bg-indigo-600 text-white"
                      }`}
                    >
                      <p>{message.content}</p>
                      <p className="text-xs opacity-70 mt-1">
                        {new Date(message.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600 italic">No conversation data available for this session.</p>
            )}
          </div>
          
          {/* Session feedback */}
          {sessionData.feedback && (
            <div className="border-t p-6 bg-gray-50">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Feedback</h2>
              
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium text-gray-800 mb-2">Summary</h3>
                  <p className="text-gray-700">{sessionData.feedback.summary}</p>
                </div>
                
                <div>
                  <h3 className="font-medium text-gray-800 mb-2">Strengths</h3>
                  <ul className="list-disc pl-5 space-y-1">
                    {sessionData.feedback.strengths.map((strength, i) => (
                      <li key={i} className="text-gray-700">{strength}</li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <h3 className="font-medium text-gray-800 mb-2">Areas for Improvement</h3>
                  <ul className="list-disc pl-5 space-y-1">
                    {sessionData.feedback.improvements.map((improvement, i) => (
                      <li key={i} className="text-gray-700">{improvement}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
} 