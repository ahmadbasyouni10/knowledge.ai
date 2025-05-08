import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { createInterview } from '../../lib/interview-store';

// Define proper types for interview data
interface InterviewRecord {
  id: string;
  userId: string;
  userName: string;
  type: string;
  topic: string;
  details: Record<string, unknown>;
  notes: string;
  date: string;
  messages: Message[];
  feedback: InterviewFeedback | null;
}

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: string;
}

interface InterviewFeedback {
  summary: string;
  strengths: string[];
  improvements: string[];
}

// In-memory db - in a real app, this would be a proper database
// Using a Node.js global to maintain interview state across API calls
declare global {
  // eslint-disable-next-line no-var
  var interviewsDb: InterviewRecord[];
}

// Initialize the global if it doesn't exist
if (!global.interviewsDb) {
  global.interviewsDb = [];
}

// For internal use only, not exported
const interviews = global.interviewsDb;

// Utility functions for internal use, not exposed as route handlers
function getInterview(id: string): InterviewRecord | undefined {
  return interviews.find(interview => interview.id === id);
}

function updateInterview(id: string, data: Partial<InterviewRecord>): boolean {
  const index = interviews.findIndex(interview => interview.id === id);
  if (index !== -1) {
    interviews[index] = { ...interviews[index], ...data };
    return true;
  }
  return false;
}

// This is the actual route handler export required by Next.js
export async function POST(request: NextRequest) {
  try {
    // Get user ID from Clerk auth
    const user = await currentUser();
    const userId = user?.id;
    
    const body = await request.json();
    
    // Create the interview record using our utility function
    const interviewRecord = createInterview({
      userId: userId || body.userId || 'anonymous',
      userName: user?.firstName || 'User',
      type: body.type,
      topic: body.topic,
      details: body.details || {},
      notes: body.notes || '',
    });
    
    return NextResponse.json({ 
      interviewId: interviewRecord.id,
      success: true 
    });
  } catch (error) {
    console.error('Error creating interview:', error);
    return NextResponse.json(
      { error: 'Failed to create interview' },
      { status: 500 }
    );
  }
} 