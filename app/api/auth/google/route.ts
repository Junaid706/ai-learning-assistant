import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { access_token } = body;
    
    // Get access token from session if not provided
    let token = access_token;
    
    if (!token) {
      // For demo purposes, just acknowledge Google session
      return NextResponse.json({ 
        message: "Google session detected. Please use NextAuth callback for full flow." 
      });
    }
    
    // Forward to Django backend for Google OAuth verification
    const res = await fetch("http://localhost:8000/api/google-auth/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ access_token: token }),
    });
    
    const data = await res.json();
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: "Connection error" }, { status: 500 });
  }
}