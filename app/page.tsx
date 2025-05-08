"use client";

import Link from "next/link";
import Image from "next/image";
import { Header } from "./components/Header";
import { Button } from "./components/Button";
import { useUser } from "@clerk/nextjs";

const features = [
  {
    name: "AI-Powered Interviews",
    description: "Our AI creates personalized interview experiences tailored to your specific topics or job positions.",
    icon: (props: React.ComponentProps<"svg">) => (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
      </svg>
    ),
  },
  {
    name: "Voice Interaction",
    description: "Speak naturally with our AI interviewer just like you would in a real interview setting.",
    icon: (props: React.ComponentProps<"svg">) => (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M8.25 4.5a3.75 3.75 0 117.5 0v8.25a3.75 3.75 0 11-7.5 0V4.5z" />
        <path d="M6 10.5a.75.75 0 01.75.75v1.5a5.25 5.25 0 1010.5 0v-1.5a.75.75 0 011.5 0v1.5a6.751 6.751 0 01-6 6.709v2.291h3a.75.75 0 010 1.5h-7.5a.75.75 0 010-1.5h3v-2.291a6.751 6.751 0 01-6-6.709v-1.5A.75.75 0 016 10.5z" />
      </svg>
    ),
  },
  {
    name: "PDF Knowledge",
    description: "Upload your own study materials or job descriptions for the AI to use during your interview.",
    icon: (props: React.ComponentProps<"svg">) => (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M5.625 1.5c-1.036 0-1.875.84-1.875 1.875v17.25c0 1.035.84 1.875 1.875 1.875h12.75c1.035 0 1.875-.84 1.875-1.875V12.75A3.75 3.75 0 0016.5 9h-1.875a1.875 1.875 0 01-1.875-1.875V5.25A3.75 3.75 0 009 1.5H5.625z" />
        <path d="M12.971 1.816A5.23 5.23 0 0114.25 5.25v1.875c0 .207.168.375.375.375H16.5a5.23 5.23 0 013.434 1.279 9.768 9.768 0 00-6.963-6.963z" />
      </svg>
    ),
  },
  {
    name: "Detailed Feedback",
    description: "Receive comprehensive feedback on your performance with specific strengths and areas for improvement.",
    icon: (props: React.ComponentProps<"svg">) => (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
      </svg>
    ),
  },
  {
    name: "Multiple Interview Types",
    description: "Practice job interviews, study for exams, or create custom interview scenarios for any topic.",
    icon: (props: React.ComponentProps<"svg">) => (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M21.731 2.269a2.625 2.625 0 00-3.712 0l-1.157 1.157 3.712 3.712 1.157-1.157a2.625 2.625 0 000-3.712zM19.513 8.199l-3.712-3.712-12.15 12.15a5.25 5.25 0 00-1.32 2.214l-.8 2.685a.75.75 0 00.933.933l2.685-.8a5.25 5.25 0 002.214-1.32L19.513 8.2z" />
      </svg>
    ),
  },
  {
    name: "Progress Tracking",
    description: "Track your improvement over time with saved interview sessions and performance analytics.",
    icon: (props: React.ComponentProps<"svg">) => (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M18.375 2.25c-1.035 0-1.875.84-1.875 1.875v15.75c0 1.035.84 1.875 1.875 1.875h.75c1.035 0 1.875-.84 1.875-1.875V4.125c0-1.036-.84-1.875-1.875-1.875h-.75zM9.75 8.625c0-1.036.84-1.875 1.875-1.875h.75c1.036 0 1.875.84 1.875 1.875v11.25c0 1.035-.84 1.875-1.875 1.875h-.75a1.875 1.875 0 01-1.875-1.875V8.625zM3 13.125c0-1.036.84-1.875 1.875-1.875h.75c1.036 0 1.875.84 1.875 1.875v6.75c0 1.035-.84 1.875-1.875 1.875h-.75A1.875 1.875 0 013 19.875v-6.75z" />
      </svg>
    ),
  },
];

export default function Home() {
  const { isSignedIn, isLoaded } = useUser();
  
  return (
    <main className="flex-1 overflow-scroll p-2 lg:p-5 bg-gradient-to-bl from-white to-indigo-700">
      <Header />

      <div className="bg-white py-24 sm:py-32 rounded-md drop-shadow-xl">
        <div className="flex flex-col justify-center items-center mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl sm:text-center">
            <h2 className="text-base font-semibold leading-7 text-indigo-600">Your AI Interview Assistant</h2> 
            
            <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-6xl">Transform your Learning into Interactive AI Experiences</p>

            <p className="mt-6 text-lg leading-8 text-gray-600">
              Introducing{" "}
              <span className="font-bold text-indigo-600">KnowledgeAI.</span>
              <br />
              Upload materials, specify your topic, and get interviewed by AI. Practice job interviews, study for exams, or test your knowledge on any topic.{"\n"}
              <span className="text-indigo-600">KnowledgeAI</span>{" "}
              turns learning into{" "}
              <span className="font-bold">interactive conversations</span>, enhancing preparation 10× fold effortlessly.
            </p>
          </div>

          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center items-center w-full">
            {isLoaded && isSignedIn ? (
              <Button asChild size="lg" className="w-full sm:w-auto">
                <Link href="/dashboard">Go to Dashboard</Link>
              </Button>
            ) : (
              <div className="flex flex-col gap-6 w-full max-w-md mx-auto justify-center items-center">
                <Button asChild size="lg" className="bg-gradient-to-r from-indigo-500 to-purple-600 w-full">
                  <Link href="/sign-in">Start Using KnowledgeAI</Link>
                </Button>
                <p className="text-sm text-gray-600">
                  Already have an account? Use the Sign In button at the top.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="relative overflow-hidden pt-16">
          <div className="mx-auto max-w-7xl px-6">
            <div className="bg-gray-100 rounded-xl shadow-2xl ring-1 ring-gray-900/10 aspect-video flex items-center justify-center">
              <div className="text-center p-8">
                <div className="text-indigo-600 text-6xl mb-4">KnowledgeAI</div>
                <p className="text-gray-500">Interview Interface Preview</p>
              </div>
            </div>
            <div aria-hidden="true" className="relative">
              <div className="absolute bottom-0 -inset-x-32 bg-gradient-to-t from-white/95 pt-[5%]" />
            </div>
          </div>
        </div>

        <div className="mx-auto mt-16 max-w-7xl px-6 sm:mt-20 md:mt-24 lg:px-8">
          <dl className="mx auto grid max-w-2xl grid-cols-1 gap-x-6 gap-y-10 text-base leading-7 text-gray-600 sm:grid-cols-2 lg:mx-0 lg:max-w-none lg:grid-cols-3 lg:gap-x-8 lg:gap-y-16">
            {features.map(feature => (
              <div key={feature.name} className="relative pl-9">
                <dt className="inline font-semibold text-gray-900">
                  <feature.icon 
                  className="absolute left-1 top-1 h-5 w-5 text-indigo-600"
                  aria-hidden="true"
                  />
                  {feature.name}
                </dt>
                <dd className="mt-2">{feature.description}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </main>
  );
}
