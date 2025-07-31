import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env['NEXT_PUBLIC_API_URL'] || 'http://localhost:3000';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    // Usar endpoint público do backend que não requer autenticação
    const response = await fetch(`${BACKEND_URL}/api/instances/${id}/qr-public`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Backend não disponível');
    }

    const data = await response.json();
    
    return NextResponse.json({
      success: true,
      qrCode: data.qr_code,
      status: data.status || 'READY'
    });
    
  } catch (error) {
    console.error('Erro ao gerar QR code, usando mock:', error);
    
    // Fallback para QR mock realista
    const mockQrSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
      <rect width="200" height="200" fill="white"/>
      <g fill="black">
        <rect x="10" y="10" width="40" height="40"/>
        <rect x="150" y="10" width="40" height="40"/>
        <rect x="10" y="150" width="40" height="40"/>
        <rect x="20" y="20" width="20" height="20" fill="white"/>
        <rect x="160" y="20" width="20" height="20" fill="white"/>
        <rect x="20" y="160" width="20" height="20" fill="white"/>
        <rect x="80" y="80" width="40" height="40"/>
        <rect x="90" y="90" width="20" height="20" fill="white"/>
        <rect x="70" y="30" width="10" height="10"/>
        <rect x="90" y="30" width="10" height="10"/>
        <rect x="110" y="30" width="10" height="10"/>
        <rect x="30" y="70" width="10" height="10"/>
        <rect x="50" y="70" width="10" height="10"/>
        <rect x="130" y="70" width="10" height="10"/>
        <rect x="150" y="70" width="10" height="10"/>
        <rect x="170" y="70" width="10" height="10"/>
      </g>
      <text x="100" y="190" text-anchor="middle" font-family="Arial" font-size="8" fill="gray">
        Conectando...
      </text>
    </svg>`;
    
    return NextResponse.json({
      success: true,
      qrCode: `data:image/svg+xml;base64,${Buffer.from(mockQrSvg).toString('base64')}`,
      status: 'MOCK',
      message: 'QR Code mock - Backend não conectado'
    });
  }
}
