/**
 * Script de VerificaÃ§Ã£o de VariÃ¡veis de Ambiente
 * Valida se todas as variÃ¡veis obrigatÃ³rias estÃ£o configuradas
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const requiredEnvVars = {
  api: ['NODE_ENV', 'PORT', 'JWT_SECRET', 'SESSION_SECRET', 'FRONTEND_URL'],
  web: ['NEXT_PUBLIC_API_URL', 'NEXTAUTH_URL', 'NEXTAUTH_SECRET'],
};

function verifyEnv(app) {
  console.log(`ðŸ” Verificando variÃ¡veis de ambiente para ${app}...`);

  // Tentar diferentes nomes de arquivo .env
  const possibleEnvFiles = ['.env', '.env.local', '.env.development'];
  let envPath = null;

  for (const envFile of possibleEnvFiles) {
    const testPath = path.join(__dirname, `../apps/${app}/${envFile}`);
    if (fs.existsSync(testPath)) {
      envPath = testPath;
      break;
    }
  }

  const envExamplePath = path.join(__dirname, `../apps/${app}/.env.example`);

  if (!envPath) {
    console.error(`âŒ Nenhum arquivo .env encontrado em apps/${app}`);
    if (fs.existsSync(envExamplePath)) {
      console.log(`ðŸ’¡ Arquivo .env.example encontrado. Copie e configure:`);
      console.log(`   cp apps/${app}/.env.example apps/${app}/.env`);
    }
    return false;
  }

  console.log(`ðŸ“„ Usando arquivo: ${path.basename(envPath)}`);

  const envContent = fs.readFileSync(envPath, 'utf8');
  const envConfig = {};

  // Parse do arquivo .env
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, value] = trimmed.split('=');
      if (key && value) {
        envConfig[key.trim()] = value.trim();
      }
    }
  });

  const missing = requiredEnvVars[app].filter(
    varName => !envConfig[varName] || envConfig[varName] === ''
  );

  if (missing.length > 0) {
    console.error(`âŒ VariÃ¡veis faltantes em apps/${app}:`);
    missing.forEach(varName => {
      console.error(`   - ${varName}`);
    });
    return false;
  }

  console.log(`âœ… VariÃ¡veis de ambiente OK para ${app}`);

  // Verificar variÃ¡veis especÃ­ficas
  if (app === 'api') {
    if (!envConfig.JWT_SECRET || envConfig.JWT_SECRET.length < 32) {
      console.warn(`âš ï¸ JWT_SECRET em ${app} deveria ter pelo menos 32 caracteres`);
    }
    if (!envConfig.SESSION_SECRET || envConfig.SESSION_SECRET.length < 32) {
      console.warn(`âš ï¸ SESSION_SECRET em ${app} deveria ter pelo menos 32 caracteres`);
    }
  }

  return true;
}

function verifyAll() {
  console.log('ðŸ” VERIFICAÃ‡ÃƒO DE VARIÃVEIS DE AMBIENTE');
  console.log('='.repeat(50));

  const apiOk = verifyEnv('api');
  const webOk = verifyEnv('web');

  console.log('\nðŸ“Š RESULTADO:');
  console.log(`API: ${apiOk ? 'âœ… OK' : 'âŒ FALHA'}`);
  console.log(`Web: ${webOk ? 'âœ… OK' : 'âŒ FALHA'}`);

  if (!apiOk || !webOk) {
    console.log('\nðŸ’¡ PRÃ“XIMOS PASSOS:');
    console.log('1. Copie os arquivos .env.example para .env');
    console.log('2. Configure as variÃ¡veis obrigatÃ³rias');
    console.log('3. Execute novamente este script');
    process.exit(1);
  }

  console.log('\nðŸŽ‰ Todas as variÃ¡veis de ambiente estÃ£o configuradas!');
}

// Executar se chamado diretamente
if (import.meta.url.startsWith('file:') && process.argv[1].endsWith('verify-env.js')) {
  verifyAll();
}

export { verifyEnv, verifyAll };
