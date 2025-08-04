// Adicionar tratamento de erro para carregamento de chunks
'use client';

import { Suspense } from 'react';

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body>
        <Suspense fallback={<div>Carregando...</div>}>
          {children}
        </Suspense>
      </body>
    </html>
  );
}
