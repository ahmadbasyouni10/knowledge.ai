"use client";

import { useState } from "react";
import { Header } from "../../components/Header";
import { Button } from "../../components/Button";
import { FileUpload } from "../../components/FileUpload";
import { cn } from "../../lib/utils";
import { useRouter } from "next/navigation";
import { BookOpenIcon, PencilIcon, CheckCircleIcon } from "@heroicons/react/24/outline";
import { BackButton } from "../../components/BackButton";

export default function QAInterviewPage() {
  const router = useRouter();
  const [subject, setSubject] = useState("");
  const [difficulty, setDifficulty] = useState<"basic" | "moderate" | "challenging">("moderate");
  const [topics, setTopics] = useState("");
  const [format, setFormat] = useState<"practice" | "quiz" | "flashcards">("practice");
  const [file, setFile] = useState<File | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!subject.trim()) {
      alert("Please enter a subject");
      return;
    }
    
    // In real implementation, we would store this in context
    console.log("Q&A setup data:", { 
      subject, 
      difficulty, 
      topics,
      format,
      file 
    });
    
    // Navigate to the interview session
    router.push("/interview/session");
  };
  
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
            <h1 className="text-3xl font-bold text-gray-900">Q&A Prep</h1>
            <p className="mt-2 text-gray-600">
              Prepare for exams, tests, or certifications with tailored practice sessions
            </p>
          </div>
          
          <div className="bg-white rounded-xl shadow-md p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
                  Subject
                </label>
                <input
                  id="subject"
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g., Biology, Computer Science, History, Mathematics"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-800"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Question Format
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    type="button"
                    className={cn(
                      "flex flex-col items-center justify-center p-3 border rounded-lg transition-colors",
                      format === "practice"
                        ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                        : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                    )}
                    onClick={() => setFormat("practice")}
                  >
                    <PencilIcon className="h-5 w-5 mb-1" />
                    <span className="text-sm font-medium">Practice Q&A</span>
                  </button>
                  <button
                    type="button"
                    className={cn(
                      "flex flex-col items-center justify-center p-3 border rounded-lg transition-colors",
                      format === "quiz"
                        ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                        : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                    )}
                    onClick={() => setFormat("quiz")}
                  >
                    <CheckCircleIcon className="h-5 w-5 mb-1" />
                    <span className="text-sm font-medium">Timed Quiz</span>
                  </button>
                  <button
                    type="button"
                    className={cn(
                      "flex flex-col items-center justify-center p-3 border rounded-lg transition-colors",
                      format === "flashcards"
                        ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                        : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                    )}
                    onClick={() => setFormat("flashcards")}
                  >
                    <BookOpenIcon className="h-5 w-5 mb-1" />
                    <span className="text-sm font-medium">Flashcards</span>
                  </button>
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
                      difficulty === "basic"
                        ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                        : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                    )}
                    onClick={() => setDifficulty("basic")}
                  >
                    <span className="text-sm font-medium">Basic</span>
                    <span className="text-xs text-gray-500">Fundamentals</span>
                  </button>
                  <button
                    type="button"
                    className={cn(
                      "flex flex-col items-center justify-center p-3 border rounded-lg transition-colors",
                      difficulty === "moderate"
                        ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                        : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                    )}
                    onClick={() => setDifficulty("moderate")}
                  >
                    <span className="text-sm font-medium">Moderate</span>
                    <span className="text-xs text-gray-500">Intermediate</span>
                  </button>
                  <button
                    type="button"
                    className={cn(
                      "flex flex-col items-center justify-center p-3 border rounded-lg transition-colors",
                      difficulty === "challenging"
                        ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                        : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                    )}
                    onClick={() => setDifficulty("challenging")}
                  >
                    <span className="text-sm font-medium">Challenging</span>
                    <span className="text-xs text-gray-500">Advanced</span>
                  </button>
                </div>
              </div>
              
              <div>
                <label htmlFor="topics" className="block text-sm font-medium text-gray-700 mb-1">
                  Specific Topics/Concepts (Optional)
                </label>
                <textarea
                  id="topics"
                  value={topics}
                  onChange={(e) => setTopics(e.target.value)}
                  rows={3}
                  placeholder="e.g., Photosynthesis, Cellular Respiration, Genetics, Evolution"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-800"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Upload Study Materials (Optional)
                </label>
                <FileUpload onFileChange={setFile} />
              </div>
              
              <Button type="submit" className="w-full">
                Start Q&A Session
              </Button>
            </form>
          </div>
          
          <div className="mt-8 bg-indigo-50 rounded-lg p-4 border border-indigo-100">
            <h3 className="text-sm font-medium text-indigo-800 mb-2">Study Tips:</h3>
            <ul className="text-sm text-indigo-700 space-y-1 list-disc list-inside">
              <li>Upload your notes or textbook pages for more targeted questions</li>
              <li>Be specific about which topics you want to focus on</li>
              <li>Explain concepts out loud as if you were teaching someone else</li>
              <li>Use the flashcard mode for quick memory recall practice</li>
              <li>Review your session feedback to identify knowledge gaps</li>
            </ul>
          </div>
        </div>
      </div>
    </main>
  );
} 