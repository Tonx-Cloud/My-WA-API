import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env['NEXT_PUBLIC_API_URL'] || 'http://localhost:3000';

export async function GET() {
  try {
    // Conectar com o backend usando o endpoint correto
    const response = await fetch(`${API_BASE_URL}/api/instances`, {
      headers: {
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(5000), // 5 segundo timeout
    });

    if (response.ok) {
      const result = await response.json();
      if (result.instances) {
        // Converter formato da API para o formato esperado pelo frontend
        const instances = result.instances.map((instance: any) => {
          // Map status to frontend expected values
          let status = 'disconnected';
          if (instance.status === 'ready' || instance.whatsapp_status === 'ready') {
            status = 'connected';
          } else if (['qr_ready', 'authenticated', 'loading'].includes(instance.status)) {
            status = 'connecting';
          }

          return {
            id: instance.id,
            name: instance.name || `InstÃ¢ncia ${instance.id}`,
            status,
            phoneNumber: instance.clientInfo?.wid
              ? instance.clientInfo.wid
                  .split('@')[0]
                  .replace(/(\d{2})(\d{2})(\d{5})(\d{4})/, '+$1 $2 $3-$4')
              : 'NÃ£o conectado',
            messagesSent: 0, // Counter implementation pending
            messagesReceived: 0, // Counter implementation pending
            lastActivity: instance.last_activity || instance.created_at || new Date().toISOString(),
            qrCode: instance.qr || null,
            clientInfo: instance.clientInfo,
            is_ready: instance.is_ready || false,
          };
        });
        return NextResponse.json(instances);
      }
    }

    // Se falhar, retornar erro apropriado
    console.error('Backend API nÃ£o disponÃ­vel');
    return NextResponse.json(
      {
        error: 'Backend API unavailable',
        message: 'Unable to fetch instances. Please check if the API service is running.',
      },
      { status: 503 }
    );
  } catch (error) {
    console.error('Error connecting to backend:', error);
    return NextResponse.json(
      {
        error: 'Backend API unavailable',
        message: 'Unable to fetch instances. Please check if the API service is running.',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 503 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Gerar um ID Ãºnico para a instÃ¢ncia
    const instanceId = `inst_${Date.now()}`;

    // Tentar conectar com o backend primeiro
    try {
      const response = await fetch(`${API_BASE_URL}/api/instances`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // TODO: Adicionar token de autenticaÃ§Ã£o
        },
        body: JSON.stringify({ name: body.name }),
        signal: AbortSignal.timeout(10000),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.instance || result.message) {
          const newInstance = {
            id: result.instance?.id || instanceId,
            name: result.instance?.name || body.name || `InstÃ¢ncia ${instanceId}`,
            status: 'connecting',
            phoneNumber: 'NÃ£o conectado',
            messagesSent: 0,
            messagesReceived: 0,
            lastActivity: new Date().toISOString(),
          };
          return NextResponse.json(newInstance, { status: 201 });
        } else {
          throw new Error(result.error || 'Failed to create instance');
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Backend responded with status ${response.status}`);
      }
    } catch (backendError) {
      console.error('Backend API nÃ£o disponÃ­vel para criaÃ§Ã£o:', backendError);
      return NextResponse.json(
        {
          error: 'Backend API unavailable',
          message: 'Unable to create instance. Please check if the API service is running.',
          details: backendError instanceof Error ? backendError.message : 'Unknown error',
        },
        { status: 503 }
      );
    }
  } catch (error) {
    console.error('Error creating instance:', error);
    return NextResponse.json({ error: 'Failed to create instance' }, { status: 500 });
  }
}
