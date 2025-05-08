"use client";

import { Header } from "../../components/Header";
import { InterviewSetupForm } from "../../components/InterviewSetupForm";
import { useRouter } from "next/navigation";

export default function LanguageInterviewPage() {
  const router = useRouter();
  
  const handleSubmit = (data: {
    type: "job" | "study" | "custom";
    topic: string;
    prompt: string;
    file: File | null;
  }) => {
    console.log("Language interview setup data:", data);
    router.push("/interview/session");
  };
  
  return (
    <main className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-gray-900">Learn Language</h1>
            <p className="mt-2 text-gray-600">
              Practice conversation in a new language with our AI tutor
            </p>
          </div>
          
          <div className="bg-white rounded-xl shadow-md p-6">
            <InterviewSetupForm 
              onSubmit={handleSubmit}
            />
          </div>
        </div>
      </div>
    </main>
  );
} 