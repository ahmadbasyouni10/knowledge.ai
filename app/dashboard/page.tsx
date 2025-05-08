"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Header } from "../components/Header";
import { BeakerIcon, AcademicCapIcon, ChatBubbleLeftRightIcon, CodeBracketIcon } from "@heroicons/react/24/outline";
import { useUser } from "@clerk/nextjs";

interface Session {
  id: string;
  type: string;
  topic: string;
  date: string;
}

export default function Dashboard() {
  const [recentSessions, setRecentSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { isSignedIn, user } = useUser();

  useEffect(() => {
    // Fetch recent sessions from sessionStorage
    const fetchRecentSessions = () => {
      // Try to get sessions from sessionStorage
      try {
        const historyJson = sessionStorage.getItem('interviewHistory');
        if (historyJson) {
          const history = JSON.parse(historyJson);
          setRecentSessions(history);
        } else {
          // If no history, set empty array
          setRecentSessions([]);
        }
      } catch (e) {
        console.error('Error reading from sessionStorage:', e);
        setRecentSessions([]);
      } finally {
        setIsLoading(false);
      }
    };

    // Small delay to prevent layout shifts
    setTimeout(fetchRecentSessions, 300);
  }, []);

  const cards = [
    {
      title: "Mock Interview",
      description: "Practice for your job interviews with our AI interviewer.",
      icon: <CodeBracketIcon className="w-8 h-8" />,
      href: "/interview/mock",
      color: "bg-blue-50 border-blue-100",
      iconColor: "text-blue-600",
      textColor: "text-blue-800",
    },
    {
      title: "Topic Lecture",
      description: "Learn a new subject with a personalized AI lecture.",
      icon: <AcademicCapIcon className="w-8 h-8" />,
      href: "#",
      badge: "Coming Soon",
      color: "bg-amber-50 border-amber-100",
      iconColor: "text-amber-600",
      textColor: "text-amber-800",
    },
    {
      title: "Meditation Session",
      description: "Relax and reduce stress with guided meditation.",
      icon: <BeakerIcon className="w-8 h-8" />,
      href: "#",
      badge: "Coming Soon",
      color: "bg-purple-50 border-purple-100",
      iconColor: "text-purple-600",
      textColor: "text-purple-800",
    },
    {
      title: "Language Practice",
      description: "Improve your language skills with natural conversations.",
      icon: <ChatBubbleLeftRightIcon className="w-8 h-8" />,
      href: "#",
      badge: "Coming Soon",
      color: "bg-green-50 border-green-100",
      iconColor: "text-green-600",
      textColor: "text-green-800",
    },
  ];

  return (
    <main className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col gap-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {isSignedIn ? `Welcome back, ${user?.firstName || user?.username || 'User'}` : 'Welcome to KnowledgeAI'}
            </h1>
            <p className="mt-1 text-gray-600">
              Choose an activity or continue a previous session
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {cards.map((card) => (
              <Link
                key={card.title}
                href={card.href}
                className={`border rounded-xl p-5 ${card.color} hover:shadow-md transition-shadow relative overflow-hidden`}
              >
                <div className={`rounded-full p-2 inline-block ${card.color} ${card.iconColor} mb-4`}>
                  {card.icon}
                </div>
                <h2 className={`text-lg font-semibold ${card.textColor}`}>
                  {card.title}
                </h2>
                <p className="text-gray-600 text-sm mt-1">{card.description}</p>
                
                {card.badge && (
                  <span className="absolute top-3 right-3 bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded-full font-medium">
                    {card.badge}
                  </span>
                )}
              </Link>
            ))}
          </div>
          
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Recent Sessions
            </h2>
            
            {isLoading ? (
              <div className="animate-pulse space-y-4">
                {[1, 2, 3].map((item) => (
                  <div
                    key={item}
                    className="border border-gray-200 rounded-lg p-4 flex items-center justify-between bg-white"
                  >
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                      <div className="ml-4">
                        <div className="h-4 bg-gray-200 rounded w-48"></div>
                        <div className="h-3 bg-gray-200 rounded w-32 mt-2"></div>
                      </div>
                    </div>
                    <div className="h-8 bg-gray-200 rounded w-24"></div>
                  </div>
                ))}
              </div>
            ) : recentSessions.length > 0 ? (
              <div className="space-y-3">
                {recentSessions.map((session) => (
                  <div
                    key={session.id}
                    className="border border-gray-200 rounded-lg p-4 flex items-center justify-between bg-white hover:border-indigo-200 hover:shadow-sm transition-all"
                  >
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600">
                        {session.type === "mock" ? (
                          <CodeBracketIcon className="w-5 h-5" />
                        ) : session.type === "topic" ? (
                          <AcademicCapIcon className="w-5 h-5" />
                        ) : (
                          <ChatBubbleLeftRightIcon className="w-5 h-5" />
                        )}
                      </div>
                      <div className="ml-4">
                        <p className="font-medium text-gray-900">
                          {session.topic}
                        </p>
                        <p className="text-sm text-gray-500">
                          {new Date(session.date).toLocaleDateString()} - {session.type === "mock"
                            ? "Mock Interview"
                            : session.type === "topic"
                            ? "Topic Lecture"
                            : "Session"}
                        </p>
                      </div>
                    </div>
                    
                    <Link 
                      href={`/interview/history/${session.id}`}
                      className="px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-md text-sm font-medium"
                    >
                      View Session
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 border border-dashed border-gray-300 rounded-lg bg-white">
                <p className="text-gray-500">
                  You haven't completed any sessions yet. Get started by selecting an activity above.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
} 