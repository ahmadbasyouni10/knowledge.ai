import { NextRequest, NextResponse } from 'next/server';
import { getInterview, updateInterview } from '../../lib/interview-store';

export async function POST(request: NextRequest) {
  try {
    const { interviewId, content, role } = await request.json();
    
    if (!interviewId || !content || !role) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Get the interview
    const interview = getInterview(interviewId);
    
    if (!interview) {
      return NextResponse.json(
        { error: 'Interview not found' },
        { status: 404 }
      );
    }
    
    // Add the message
    const messageId = Date.now().toString();
    const newMessage = {
      id: messageId,
      content,
      role,
      timestamp: new Date().toISOString(),
    };
    
    // Add message to interview
    interview.messages.push(newMessage);
    updateInterview(interviewId, { messages: interview.messages });
    
    // sessionStorage operations should be done client-side
    
    return NextResponse.json({ 
      messageId,
      success: true 
    });
  } catch (error) {
    console.error('Error saving message:', error);
    return NextResponse.json(
      { error: 'Failed to save message' },
      { status: 500 }
    );
  }
} 