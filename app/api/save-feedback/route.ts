import { NextRequest, NextResponse } from 'next/server';
import { getInterview, updateInterview } from '../../lib/interview-store';

export async function POST(request: NextRequest) {
  try {
    const { interviewId, feedback } = await request.json();
    
    if (!interviewId || !feedback) {
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
    
    // Update interview with feedback
    updateInterview(interviewId, { feedback });
    
    return NextResponse.json({ 
      success: true 
    });
  } catch (error) {
    console.error('Error saving feedback:', error);
    return NextResponse.json(
      { error: 'Failed to save feedback' },
      { status: 500 }
    );
  }
} 