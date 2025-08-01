import { NextRequest, NextResponse } from 'next/server'

const API_BASE_URL = process.env['NEXT_PUBLIC_API_URL'] || 'http://localhost:3000'

export async function GET(request: NextRequest) {
  try {
    // Attempt to connect to backend API with timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000)

    try {
      const response = await fetch(`${API_BASE_URL}/api/messages`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': request.headers.get('Authorization') || '',
        },
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error('Failed to fetch messages')
      }

      const data = await response.json()
      
      return NextResponse.json(data)
    } catch (error) {
      clearTimeout(timeoutId)
      throw error
    }
  } catch (error) {
    console.error('Error fetching messages from backend:', error)
    
    return NextResponse.json(
      { 
        error: 'Backend API unavailable', 
        message: 'Unable to fetch messages. Please check if the API service is running.',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 503 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Attempt to connect to backend API with timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000)

    try {
      const response = await fetch(`${API_BASE_URL}/api/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': request.headers.get('Authorization') || '',
        },
        body: JSON.stringify(body),
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error('Failed to send message')
      }

      const data = await response.json()
      
      return NextResponse.json(data)
    } catch (error) {
      clearTimeout(timeoutId)
      throw error
    }
  } catch (error) {
    console.error('Error sending message via backend:', error)
    
    return NextResponse.json(
      { 
        error: 'Backend API unavailable', 
        message: 'Unable to send message. Please check if the API service is running.',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 503 }
    )
  }
}

