// Define proper types for interview data
export interface InterviewRecord {
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

export interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: string;
}

export interface InterviewFeedback {
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

// Internal reference to the interviews database
const interviews = global.interviewsDb;

// Get all interviews
export function getInterviews(): InterviewRecord[] {
  return [...interviews]; // Return a copy to prevent direct mutation
}

// Utility function to get an interview by ID
export function getInterview(id: string): InterviewRecord | undefined {
  return interviews.find(interview => interview.id === id);
}

// Utility function to update an interview
export function updateInterview(id: string, data: Partial<InterviewRecord>): boolean {
  const index = interviews.findIndex(interview => interview.id === id);
  if (index !== -1) {
    interviews[index] = { ...interviews[index], ...data };
    return true;
  }
  return false;
}

// Create a new interview
export function createInterview(data: Omit<InterviewRecord, 'id' | 'date' | 'messages' | 'feedback'>): InterviewRecord {
  const interviewId = `interview-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  
  const interviewRecord: InterviewRecord = {
    id: interviewId,
    ...data,
    date: new Date().toISOString(),
    messages: [],
    feedback: null,
  };
  
  interviews.push(interviewRecord);
  console.log(`Created interview: ${interviewId}. Total interviews: ${interviews.length}`);
  
  return interviewRecord;
} 