"use client";

import { useState } from "react";
import { Header } from "../../components/Header";
import { Button } from "../../components/Button";
import { FileUpload } from "../../components/FileUpload";
import { cn } from "../../lib/utils";
import { useRouter } from "next/navigation";
import { BriefcaseIcon, CodeBracketIcon, BeakerIcon, ChartBarIcon, UserIcon, DocumentTextIcon, CubeIcon } from "@heroicons/react/24/outline";
import { BackButton } from "../../components/BackButton";

export default function MockInterviewPage() {
  const router = useRouter();
  const [position, setPosition] = useState("");
  const [jobCategory, setJobCategory] = useState<"tech" | "business" | "science" | "other">("tech");
  const [experience, setExperience] = useState<"entry" | "mid" | "senior">("mid");
  const [interviewType, setInterviewType] = useState<"general" | "system-design" | "coding" | "frontend" | "backend">("general");
  const [specificSkills, setSpecificSkills] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [notes, setNotes] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!position.trim()) {
      alert("Please enter a job position");
      return;
    }
    
    setIsCreating(true);
    
    try {
      // Enhanced focus areas with explicit parsing from the specific skills
      // and better handling of the interview type
      const parsedFocusAreas = specificSkills
        .toLowerCase()
        .split(/[,;\n]/)
        .map(s => s.trim())
        .filter(Boolean);
      
      // Extract primary focus types from the specific skills
      const hasFocusOnGraphs = 
        parsedFocusAreas.some(area => 
          area.includes('graph') || 
          area.includes('tree') || 
          area.includes('dfs') || 
          area.includes('bfs'));
      
      const hasFocusOnSystemDesign = 
        parsedFocusAreas.some(area => 
          area.includes('system design') || 
          area.includes('architecture') || 
          area.includes('scalability'));
        
      const hasFocusOnCoding = 
        parsedFocusAreas.some(area => 
          area.includes('coding') || 
          area.includes('algorithm') || 
          area.includes('leetcode') ||
          area.includes('data structure'));
      
      // Check for specific system design projects
      const hasChatAppFocus = 
        parsedFocusAreas.some(area => 
          area.includes('chat') || 
          area.includes('messaging') ||
          area.includes('communication'));
          
      // Process notes to include explicit instructions about coding
      let enhancedNotes = notes;
      
      // Add explicit instruction to avoid asking for code if it's a coding interview
      if (interviewType === 'coding' || hasFocusOnCoding || hasFocusOnGraphs) {
        enhancedNotes += "\nIMPORTANT: DO NOT ask the candidate to write actual code. " +
          "This interview is verbal only. Focus on algorithm descriptions, time/space complexity, " +
          "and trade-offs. Let the candidate explain approaches rather than writing code.";
      }
      
      // Add explicit instruction about system design focus if specified
      if (interviewType === 'system-design' && specificSkills.trim()) {
        enhancedNotes += "\nIMPORTANT: Focus the system design interview on the specific topics/applications mentioned in the skills field. " +
          "Avoid generic examples unless the candidate is struggling with the specified topics.";
      }
        
      // Create interview details
      const details = {
        jobCategory,
        experience,
        interviewType,
        specificSkills: specificSkills.trim() || undefined,
        fileUploaded: file ? true : false,
        // Format the skills as a comma separated list for the AI to use
        focusAreas: [
          // First add the interview type as a focus area
          interviewType === "system-design" ? "system design" :
          interviewType === "coding" ? "coding algorithms" :
          interviewType === "frontend" ? "front-end development" :
          interviewType === "backend" ? "back-end development" : "",
          // Then add any detected focus areas
          ...(hasFocusOnGraphs ? ["graph algorithms"] : []),
          ...(hasFocusOnSystemDesign ? ["system design"] : []),
          ...(hasFocusOnCoding ? ["coding algorithms"] : []),
          ...(hasChatAppFocus ? ["chat application", "messaging system"] : []),
          // Then add the raw parsed areas
          ...parsedFocusAreas
        ].filter(Boolean),
      };
      
      // Create the interview in Convex
      const response = await fetch('/api/create-interview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          // Using a generic userId for now - in a real app, this would be authenticated
          userId: 'user-' + Math.random().toString(36).substring(7),
          type: "mock",
          topic: position,
          details,
          notes: enhancedNotes,
        }),
      });
      
      let interviewId;
      if (response.ok) {
        const data = await response.json();
        interviewId = data.interviewId;
      } else {
        console.error("Failed to create interview in database");
        // Use a simulated ID as fallback
        interviewId = `mock-${Date.now()}`;
      }
      
      // Store interview data in session storage for the session page
      const sessionData = {
        id: interviewId,
        type: "mock",
        topic: position,
        details,
        notes,
      };
      
      sessionStorage.setItem('interviewSession', JSON.stringify(sessionData));
      
      // Navigate to the interview session
      router.push("/interview/session");
    } catch (error) {
      console.error("Error creating interview:", error);
      alert("There was an error setting up your interview. Please try again.");
    } finally {
      setIsCreating(false);
    }
  };
  
  const categoryIcons = {
    tech: CodeBracketIcon,
    business: ChartBarIcon,
    science: BeakerIcon,
    other: UserIcon
  };
  
  const CategoryIcon = categoryIcons[jobCategory];
  
  const getSkillsPlaceholder = () => {
    switch (interviewType) {
      case "system-design":
        return "e.g., Chat/Messaging App, Social Media Platform, E-commerce System, Video Streaming Service, Ride-sharing Platform";
      case "coding":
        return "e.g., data structures, algorithms, dynamic programming";
      case "frontend":
        return "e.g., React, CSS, UI/UX, responsive design";
      case "backend":
        return "e.g., Node.js, databases, API design, microservices";
      default:
        return "e.g., React, System Design, Leadership, Problem Solving";
    }
  };

  const getSkillsLabel = () => {
    switch (interviewType) {
      case "system-design":
        return "System to Design (Choose a specific system to design)";
      case "coding":
        return "Specific Algorithms/Problems (Optional)";
      case "frontend":
        return "Front-End Skills to Focus On (Optional)";
      case "backend":
        return "Back-End Skills to Focus On (Optional)";
      default:
        return "Specific Skills/Topics to Focus On (Optional)";
    }
  };

  const renderSystemDesignInfo = () => {
    if (interviewType !== "system-design") return null;
    
    return (
      <div className="mt-4 bg-blue-50 rounded-lg p-4 border border-blue-100">
        <h3 className="text-sm font-medium text-blue-800 mb-2 flex items-center">
          <CubeIcon className="h-5 w-5 mr-1" />
          System Design Interview Overview
        </h3>
        <p className="text-sm text-blue-700 mb-2">
          <span className="font-bold">Important:</span> Please specify the system you want to design above. 
          Your interview will focus exclusively on designing this system.
        </p>
        <p className="text-sm text-blue-700 mb-2">
          Your interview will cover these key areas for your chosen system:
        </p>
        <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside mb-2">
          <li>Requirements gathering (functional & non-functional)</li>
          <li>High-level architecture & component design</li>
          <li>Data modeling & database selection</li>
          <li>Scalability strategies & performance optimization</li>
          <li>Reliability, fault tolerance & consistency considerations</li>
          <li>And other advanced topics based on your system</li>
        </ul>
      </div>
    );
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
            <h1 className="text-3xl font-bold text-gray-900">Mock Interview</h1>
            <p className="mt-2 text-gray-600">
              Practice for your upcoming job interview with our realistic AI interviewer
            </p>
          </div>
          
          <div className="bg-white rounded-xl shadow-md p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="position" className="block text-sm font-medium text-gray-700 mb-1">
                  Job Position
                </label>
                <input
                  id="position"
                  type="text"
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                  placeholder="e.g., Software Engineer, Product Manager, Data Scientist"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-800"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Job Category
                </label>
                <div className="grid grid-cols-4 gap-3">
                  {(['tech', 'business', 'science', 'other'] as const).map((category) => {
                    const Icon = categoryIcons[category];
                    return (
                      <button
                        key={category}
                        type="button"
                        className={cn(
                          "flex flex-col items-center justify-center p-3 border rounded-lg transition-colors",
                          jobCategory === category
                            ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                            : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                        )}
                        onClick={() => setJobCategory(category)}
                      >
                        <Icon className="h-5 w-5 mb-1" />
                        <span className="text-sm font-medium capitalize">{category}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
              
              {jobCategory === 'tech' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Interview Focus
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      type="button"
                      className={cn(
                        "flex flex-col items-center justify-center p-3 border rounded-lg transition-colors",
                        interviewType === "general"
                          ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                          : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                      )}
                      onClick={() => setInterviewType("general")}
                    >
                      <span className="text-sm font-medium">General</span>
                      <span className="text-xs text-gray-500">Mixed questions</span>
                    </button>
                    <button
                      type="button"
                      className={cn(
                        "flex flex-col items-center justify-center p-3 border rounded-lg transition-colors",
                        interviewType === "system-design"
                          ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                          : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                      )}
                      onClick={() => setInterviewType("system-design")}
                    >
                      <span className="text-sm font-medium">System Design</span>
                      <span className="text-xs text-gray-500">Architecture focused</span>
                    </button>
                    <button
                      type="button"
                      className={cn(
                        "flex flex-col items-center justify-center p-3 border rounded-lg transition-colors",
                        interviewType === "coding"
                          ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                          : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                      )}
                      onClick={() => setInterviewType("coding")}
                    >
                      <span className="text-sm font-medium">Coding</span>
                      <span className="text-xs text-gray-500">Algorithm challenges</span>
                    </button>
                    <button
                      type="button"
                      className={cn(
                        "flex flex-col items-center justify-center p-3 border rounded-lg transition-colors",
                        interviewType === "frontend"
                          ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                          : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                      )}
                      onClick={() => setInterviewType("frontend")}
                    >
                      <span className="text-sm font-medium">Front-End</span>
                      <span className="text-xs text-gray-500">UI development</span>
                    </button>
                    <button
                      type="button"
                      className={cn(
                        "flex flex-col items-center justify-center p-3 border rounded-lg transition-colors",
                        interviewType === "backend"
                          ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                          : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                      )}
                      onClick={() => setInterviewType("backend")}
                    >
                      <span className="text-sm font-medium">Back-End</span>
                      <span className="text-xs text-gray-500">Server development</span>
                    </button>
                  </div>
                  
                  {renderSystemDesignInfo()}
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Experience Level
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    type="button"
                    className={cn(
                      "flex flex-col items-center justify-center p-3 border rounded-lg transition-colors",
                      experience === "entry"
                        ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                        : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                    )}
                    onClick={() => setExperience("entry")}
                  >
                    <span className="text-sm font-medium">Entry Level</span>
                    <span className="text-xs text-gray-500">0-2 years</span>
                  </button>
                  <button
                    type="button"
                    className={cn(
                      "flex flex-col items-center justify-center p-3 border rounded-lg transition-colors",
                      experience === "mid"
                        ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                        : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                    )}
                    onClick={() => setExperience("mid")}
                  >
                    <span className="text-sm font-medium">Mid Level</span>
                    <span className="text-xs text-gray-500">3-5 years</span>
                  </button>
                  <button
                    type="button"
                    className={cn(
                      "flex flex-col items-center justify-center p-3 border rounded-lg transition-colors",
                      experience === "senior"
                        ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                        : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                    )}
                    onClick={() => setExperience("senior")}
                  >
                    <span className="text-sm font-medium">Senior Level</span>
                    <span className="text-xs text-gray-500">6+ years</span>
                  </button>
                </div>
              </div>
              
              <div>
                <label htmlFor="skills" className="block text-sm font-medium text-gray-700 mb-1">
                  {getSkillsLabel()}
                </label>
                <textarea
                  id="skills"
                  value={specificSkills}
                  onChange={(e) => setSpecificSkills(e.target.value)}
                  rows={3}
                  placeholder={getSkillsPlaceholder()}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-800"
                />
              </div>
              
              <div>
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                  Interviewer Notes (Optional)
                </label>
                <textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  placeholder="Add any additional context for the AI interviewer (this won't be shown in the conversation)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-800"
                />
                <p className="mt-1 text-xs text-gray-500">
                  These notes help guide the interviewer without being directly mentioned in the conversation.
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Upload Additional Materials (Optional)
                </label>
                <FileUpload onFileChange={setFile} />
                <p className="mt-1 text-xs text-gray-500">
                  Upload any relevant materials such as job descriptions, system diagrams, or other documents.
                </p>
              </div>
              
              <Button type="submit" className="w-full" disabled={isCreating}>
                {isCreating ? "Setting up..." : "Start Mock Interview"}
              </Button>
            </form>
          </div>
          
          <div className="mt-8 bg-indigo-50 rounded-lg p-4 border border-indigo-100">
            <h3 className="text-sm font-medium text-indigo-800 mb-2 flex items-center">
              <DocumentTextIcon className="h-5 w-5 mr-1" />
              Tips for a successful interview:
            </h3>
            <ul className="text-sm text-indigo-700 space-y-1 list-disc list-inside">
              <li>Speak clearly and take your time to formulate responses</li>
              <li>For system design interviews, focus on scalability and trade-offs</li>
              <li>For coding interviews, explain your thought process step by step</li>
              <li>Provide specific examples from your experience when relevant</li>
              <li>Ask for feedback after the interview to identify improvement areas</li>
            </ul>
          </div>
        </div>
      </div>
    </main>
  );
} 