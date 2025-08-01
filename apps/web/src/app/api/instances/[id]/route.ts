import { NextRequest, NextResponse } from 'next/server'

const API_BASE_URL = process.env['NEXT_PUBLIC_API_URL'] || 'http://localhost:3000'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Tentar conectar com o backend primeiro
    try {
      const response = await fetch(`${API_BASE_URL}/api/instances/${params.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(5000),
      })

      if (response.ok) {
        const data = await response.json()
        return NextResponse.json(data)
      } else {
        throw new Error(`Backend responded with status ${response.status}`)
      }
    } catch (backendError) {
      console.error('Backend API não disponível para deleção:', backendError)
      return NextResponse.json(
        { 
          error: 'Backend API unavailable', 
          message: 'Unable to delete instance. Please check if the API service is running.',
          details: backendError instanceof Error ? backendError.message : 'Unknown error'
        }, 
        { status: 503 }
      )
    }
  } catch (error) {
    console.error('Error deleting instance:', error)
    return NextResponse.json(
      { error: 'Failed to delete instance' }, 
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Tentar conectar com o backend primeiro
    try {
      const response = await fetch(`${API_BASE_URL}/api/instances/${params.id}`, {
        headers: {
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(5000),
      })

      if (response.ok) {
        const data = await response.json()
        return NextResponse.json(data.instance)
      } else {
        throw new Error(`Backend responded with status ${response.status}`)
      }
    } catch (backendError) {
      console.error('Backend API não disponível:', backendError)
      return NextResponse.json(
        { 
          error: 'Backend API unavailable', 
          message: 'Unable to fetch instance. Please check if the API service is running.',
          details: backendError instanceof Error ? backendError.message : 'Unknown error'
        }, 
        { status: 503 }
      )
    }
  } catch (error) {
    console.error('Error fetching instance:', error)
    return NextResponse.json(
      { error: 'Failed to fetch instance' }, 
      { status: 500 }
    )
  }
}
