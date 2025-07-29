import { NextRequest, NextResponse } from 'next/server'

const API_BASE_URL = process.env['NEXT_PUBLIC_API_URL'] || 'http://localhost:3000'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const instanceId = params.id
    
    // Tentar desconectar via nova API
    const response = await fetch(`${API_BASE_URL}/api/instances-v2/logout/${instanceId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(5000),
    })

    if (response.ok) {
      const result = await response.json()
      if (result.success) {
        return NextResponse.json({ 
          success: true, 
          message: 'Instance disconnected successfully' 
        })
      }
    }
    
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to disconnect instance' 
    }, { status: 500 })
    
  } catch (error) {
    console.error('Error disconnecting instance:', error)
    return NextResponse.json(
      { error: 'Failed to disconnect instance' }, 
      { status: 500 }
    )
  }
}
