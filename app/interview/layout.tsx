import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "KnowledgeAI - Interview",
  description: "Practice interviews with AI on any topic",
};

export default function InterviewLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex flex-col min-h-screen">
      {children}
    </div>
  );
} 