import { useState } from "react";
import { Button } from "./Button";
import { FileUpload } from "./FileUpload";
import { cn } from "../lib/utils";

type InterviewType = "job" | "study" | "custom";

type InterviewSetupFormProps = {
  onSubmit: (data: {
    type: InterviewType;
    topic: string;
    prompt: string;
    file: File | null;
  }) => void;
  className?: string;
};

export function InterviewSetupForm({ onSubmit, className }: InterviewSetupFormProps) {
  const [interviewType, setInterviewType] = useState<InterviewType>("job");
  const [topic, setTopic] = useState("");
  const [prompt, setPrompt] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!topic.trim()) {
      alert("Please enter a topic");
      return;
    }
    
    onSubmit({
      type: interviewType,
      topic,
      prompt,
      file,
    });
  };

  return (
    <form onSubmit={handleSubmit} className={cn("space-y-6", className)}>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Interview Type
        </label>
        <div className="grid grid-cols-3 gap-3">
          <button
            type="button"
            className={cn(
              "flex flex-col items-center justify-center p-3 border rounded-lg transition-colors",
              interviewType === "job"
                ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
            )}
            onClick={() => setInterviewType("job")}
          >
            <span className="text-lg">💼</span>
            <span className="text-sm font-medium mt-1">Job Interview</span>
          </button>
          <button
            type="button"
            className={cn(
              "flex flex-col items-center justify-center p-3 border rounded-lg transition-colors",
              interviewType === "study"
                ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
            )}
            onClick={() => setInterviewType("study")}
          >
            <span className="text-lg">📚</span>
            <span className="text-sm font-medium mt-1">Study Quiz</span>
          </button>
          <button
            type="button"
            className={cn(
              "flex flex-col items-center justify-center p-3 border rounded-lg transition-colors",
              interviewType === "custom"
                ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
            )}
            onClick={() => setInterviewType("custom")}
          >
            <span className="text-lg">🎯</span>
            <span className="text-sm font-medium mt-1">Custom</span>
          </button>
        </div>
      </div>

      <div>
        <label htmlFor="topic" className="block text-sm font-medium text-gray-700 mb-1">
          Topic
        </label>
        <input
          id="topic"
          type="text"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder={
            interviewType === "job"
              ? "e.g., Full Stack Developer, ML Engineer"
              : interviewType === "study"
              ? "e.g., Chemistry, React Fundamentals"
              : "Enter your topic"
          }
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          required
        />
      </div>

      <div>
        <label htmlFor="prompt" className="block text-sm font-medium text-gray-700 mb-1">
          Additional Instructions (Optional)
        </label>
        <textarea
          id="prompt"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={3}
          placeholder={
            interviewType === "job"
              ? "e.g., Focus on React and Node.js, intermediate difficulty"
              : interviewType === "study"
              ? "e.g., Quiz me on Chemical Bonding and Molecular Structure"
              : "Provide any specific instructions for your interview"
          }
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Upload Reference Material (Optional)
        </label>
        <FileUpload onFileChange={setFile} />
      </div>

      <Button type="submit" className="w-full">
        Start Interview
      </Button>
    </form>
  );
} 