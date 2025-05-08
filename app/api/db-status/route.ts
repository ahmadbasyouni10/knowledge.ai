import { NextResponse } from 'next/server';
import { getInterviews, InterviewRecord } from '../../lib/interview-store';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: string;
}

interface Feedback {
  summary: string;
  strengths: string[];
  improvements: string[];
}

interface Interview {
  id: string;
  type: string;
  topic: string;
  date: string;
  messages: Message[];
  feedback: Feedback | null;
  userId: string;
  userName: string;
  notes: string;
  details: Record<string, unknown>;
}

interface SampleData {
  id: string;
  type: string;
  topic: string;
  date: string;
  messageCount: number;
  hasFeedback: boolean;
}

export async function GET() {
  try {
    // Get interviews from the utility function
    const interviews = getInterviews();
    
    // Count of interviews in the database
    const interviewCount = interviews.length;
    
    // Get sample data (without sensitive info)
    const sampleData = interviews.slice(0, 5).map((interview: InterviewRecord): SampleData => ({
      id: interview.id,
      type: interview.type,
      topic: interview.topic,
      date: interview.date,
      messageCount: interview.messages?.length || 0,
      hasFeedback: interview.feedback ? true : false
    }));
    
    return NextResponse.json({
      status: 'running',
      storage: 'in-memory',
      interviewCount,
      sampleData: interviewCount > 0 ? sampleData : 'No interviews yet',
    });
  } catch (error) {
    console.error('Error checking database status:', error);
    return NextResponse.json(
      { 
        status: 'error',
        message: 'Failed to check database status',
        error: String(error)
      },
      { status: 500 }
    );
  }
} 