const express = require('express');
const app = express();

// Middleware para capturar o callback do Google OAuth
app.get('/auth/callback', (req, res) => {
  const { code, state, error } = req.query;
  
  console.log('=== CALLBACK RECEBIDO ===');
  console.log('Query params:', req.query);
  console.log('URL completa:', req.url);
  
  if (error) {
    console.log('Erro no OAuth:', error);
    return res.redirect('http://localhost:3001/login?error=oauth_error');
  }
  
  if (code) {
    console.log('Código OAuth recebido:', code);
    const redirectUrl = `http://localhost:3000/api/auth/google/callback?code=${code}&state=${state || ''}`;
    console.log('Redirecionando para:', redirectUrl);
    // Redirecionar para nosso servidor principal com o código
    return res.redirect(redirectUrl);
  }
  
  console.log('Nenhum código OAuth recebido');
  res.redirect('http://localhost:3001/login?error=no_code');
});

// Página de informação
app.get('/', (req, res) => {
  res.send(`
    <h1>Servidor OAuth Auxiliar</h1>
    <p>Este servidor está executando na porta 80 para capturar callbacks do Google OAuth.</p>
    <p>Aplicação principal: <a href="http://localhost:3001">http://localhost:3001</a></p>
  `);
});

const PORT = 80;
app.listen(PORT, () => {
  console.log(`🔗 Servidor OAuth auxiliar rodando na porta ${PORT}`);
  console.log(`📍 Callback URL: http://localhost:${PORT}/auth/callback`);
});
