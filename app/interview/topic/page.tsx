"use client";

import { useState } from "react";
import { Header } from "../../components/Header";
import { Button } from "../../components/Button";
import { FileUpload } from "../../components/FileUpload";
import { cn } from "../../lib/utils";
import { useRouter } from "next/navigation";
import { BackButton } from "../../components/BackButton";
import { AcademicCapIcon, BookOpenIcon, BeakerIcon, CodeBracketIcon, MusicalNoteIcon } from "@heroicons/react/24/outline";

export default function TopicLecturePage() {
  const router = useRouter();
  const [topic, setTopic] = useState("");
  const [category, setCategory] = useState<"tech" | "science" | "arts" | "business" | "other">("tech");
  const [difficulty, setDifficulty] = useState<"beginner" | "intermediate" | "advanced">("intermediate");
  const [notes, setNotes] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!topic.trim()) {
      alert("Please enter a topic");
      return;
    }
    
    setIsCreating(true);
    
    try {
      // Create lecture details
      const details = {
        category,
        difficulty,
        fileUploaded: file ? true : false,
      };
      
      // Create the interview in database
      const response = await fetch('/api/create-interview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: 'user-' + Math.random().toString(36).substring(7),
          type: "topic",
          topic,
          details,
          notes,
        }),
      });
      
      let interviewId;
      if (response.ok) {
        const data = await response.json();
        interviewId = data.interviewId;
      } else {
        console.error("Failed to create topic lecture in database");
        interviewId = `topic-${Date.now()}`;
      }
      
      // Store lecture data in session storage for the session page
      const sessionData = {
        id: interviewId,
        type: "topic",
        topic,
        details,
        notes,
      };
      
      sessionStorage.setItem('interviewSession', JSON.stringify(sessionData));
      
      // Navigate to the lecture session
      router.push("/interview/session");
    } catch (error) {
      console.error("Error creating topic lecture:", error);
      alert("There was an error setting up your lecture. Please try again.");
    } finally {
      setIsCreating(false);
    }
  };
  
  const categoryIcons = {
    tech: CodeBracketIcon,
    science: BeakerIcon,
    arts: MusicalNoteIcon,
    business: BookOpenIcon,
    other: AcademicCapIcon
  };
  
  const CategoryIcon = categoryIcons[category];
  
  return (
    <main className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <BackButton href="/dashboard" />
            <div></div> {/* Empty div for flex alignment */}
          </div>
          
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-gray-900">Topic Lecture</h1>
            <p className="mt-2 text-gray-600">
              Learn about any subject with our AI tutor in an interactive lecture format
            </p>
          </div>
          
          <div className="bg-white rounded-xl shadow-md p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="topic" className="block text-sm font-medium text-gray-700 mb-1">
                  Topic
                </label>
                <input
                  id="topic"
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g., React Hooks, Machine Learning, History of Jazz"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-800"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <div className="grid grid-cols-5 gap-3">
                  {(['tech', 'science', 'arts', 'business', 'other'] as const).map((cat) => {
                    const Icon = categoryIcons[cat];
                    return (
                      <button
                        key={cat}
                        type="button"
                        className={cn(
                          "flex flex-col items-center justify-center p-3 border rounded-lg transition-colors",
                          category === cat
                            ? "border-green-500 bg-green-50 text-green-700"
                            : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                        )}
                        onClick={() => setCategory(cat)}
                      >
                        <Icon className="h-5 w-5 mb-1" />
                        <span className="text-sm font-medium capitalize">{cat}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Difficulty Level
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    type="button"
                    className={cn(
                      "flex flex-col items-center justify-center p-3 border rounded-lg transition-colors",
                      difficulty === "beginner"
                        ? "border-green-500 bg-green-50 text-green-700"
                        : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                    )}
                    onClick={() => setDifficulty("beginner")}
                  >
                    <span className="text-sm font-medium">Beginner</span>
                    <span className="text-xs text-gray-500">Fundamental concepts</span>
                  </button>
                  <button
                    type="button"
                    className={cn(
                      "flex flex-col items-center justify-center p-3 border rounded-lg transition-colors",
                      difficulty === "intermediate"
                        ? "border-green-500 bg-green-50 text-green-700"
                        : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                    )}
                    onClick={() => setDifficulty("intermediate")}
                  >
                    <span className="text-sm font-medium">Intermediate</span>
                    <span className="text-xs text-gray-500">Beyond the basics</span>
                  </button>
                  <button
                    type="button"
                    className={cn(
                      "flex flex-col items-center justify-center p-3 border rounded-lg transition-colors",
                      difficulty === "advanced"
                        ? "border-green-500 bg-green-50 text-green-700"
                        : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                    )}
                    onClick={() => setDifficulty("advanced")}
                  >
                    <span className="text-sm font-medium">Advanced</span>
                    <span className="text-xs text-gray-500">Complex concepts</span>
                  </button>
                </div>
              </div>
              
              <div>
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                  Additional Notes for Tutor (Optional)
                </label>
                <textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  placeholder="Add specific aspects of the topic you'd like to focus on, or any background knowledge you already have"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-800"
                />
                <p className="mt-1 text-xs text-gray-500">
                  These notes help the tutor customize the lecture without being directly mentioned in the conversation.
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Upload Materials (Optional)
                </label>
                <FileUpload onFileChange={setFile} />
                <p className="mt-1 text-xs text-gray-500">
                  Upload any relevant materials to enhance your learning experience (e.g., lecture notes, papers, diagrams).
                </p>
              </div>
              
              <Button type="submit" className="w-full" disabled={isCreating}>
                {isCreating ? "Setting up..." : "Start Lecture"}
              </Button>
            </form>
          </div>
          
          <div className="mt-8 bg-green-50 rounded-lg p-4 border border-green-100">
            <h3 className="text-sm font-medium text-green-800 mb-2">Tips for a productive learning session:</h3>
            <ul className="text-sm text-green-700 space-y-1 list-disc list-inside">
              <li>Prepare specific questions about the topic</li>
              <li>Take notes during the lecture to reinforce learning</li>
              <li>Ask for clarification whenever concepts aren't clear</li>
              <li>Request practical examples to understand theoretical concepts</li>
              <li>Try to relate the new information to things you already know</li>
            </ul>
          </div>
        </div>
      </div>
    </main>
  );
} 