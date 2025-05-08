import { Button } from "./Button";
import { cn } from "../lib/utils";
import { CheckCircleIcon, XCircleIcon } from "@heroicons/react/24/solid";

type FeedbackProps = {
  summary: string;
  strengths: string[];
  improvements: string[];
  onSave: () => void;
  onRestart: () => void;
  className?: string;
};

export function InterviewFeedback({
  summary,
  strengths,
  improvements,
  onSave,
  onRestart,
  className,
}: FeedbackProps) {
  return (
    <div className={cn("bg-white rounded-xl shadow-lg overflow-hidden", className)}>
      <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-indigo-500 to-purple-500">
        <h2 className="text-2xl font-bold text-white">Interview Feedback</h2>
        <p className="text-white/80 mt-1">
          Review your performance and areas for improvement
        </p>
      </div>
      
      <div className="p-6">
        <div className="mb-8">
          <h3 className="text-lg font-medium text-gray-900 mb-3">Summary</h3>
          <p className="text-gray-700 leading-relaxed bg-indigo-50 p-4 rounded-lg border border-indigo-100">
            {summary}
          </p>
        </div>
        
        <div className="mb-8">
          <h3 className="text-lg font-medium text-green-700 mb-3 flex items-center">
            <CheckCircleIcon className="w-5 h-5 mr-2" />
            Strengths
          </h3>
          <ul className="space-y-2">
            {strengths.map((strength, index) => (
              <li key={index} className="flex items-start bg-green-50 p-3 rounded-lg">
                <CheckCircleIcon className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700">{strength}</span>
              </li>
            ))}
          </ul>
        </div>
        
        <div className="mb-8">
          <h3 className="text-lg font-medium text-amber-700 mb-3 flex items-center">
            <XCircleIcon className="w-5 h-5 mr-2" />
            Areas for Improvement
          </h3>
          <ul className="space-y-2">
            {improvements.map((improvement, index) => (
              <li key={index} className="flex items-start bg-amber-50 p-3 rounded-lg">
                <XCircleIcon className="w-5 h-5 text-amber-500 mr-2 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700">{improvement}</span>
              </li>
            ))}
          </ul>
        </div>
        
        <div className="flex justify-between pt-4">
          <Button variant="outline" onClick={onRestart} className="border-indigo-200 hover:bg-indigo-50">
            Start New Interview
          </Button>
          <Button onClick={onSave} className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600">
            Save Feedback
          </Button>
        </div>
      </div>
    </div>
  );
} 