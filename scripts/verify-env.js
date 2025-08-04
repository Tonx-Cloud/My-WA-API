/**
 * Script de Verificação de Variáveis de Ambiente
 * Valida se todas as variáveis obrigatórias estão configuradas
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
  console.log(`🔍 Verificando variáveis de ambiente para ${app}...`);

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
    console.error(`❌ Nenhum arquivo .env encontrado em apps/${app}`);
    if (fs.existsSync(envExamplePath)) {
      console.log(`💡 Arquivo .env.example encontrado. Copie e configure:`);
      console.log(`   cp apps/${app}/.env.example apps/${app}/.env`);
    }
    return false;
  }

  console.log(`📄 Usando arquivo: ${path.basename(envPath)}`);

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
    console.error(`❌ Variáveis faltantes em apps/${app}:`);
    missing.forEach(varName => {
      console.error(`   - ${varName}`);
    });
    return false;
  }

  console.log(`✅ Variáveis de ambiente OK para ${app}`);

  // Verificar variáveis específicas
  if (app === 'api') {
    if (!envConfig.JWT_SECRET || envConfig.JWT_SECRET.length < 32) {
      console.warn(`⚠️ JWT_SECRET em ${app} deveria ter pelo menos 32 caracteres`);
    }
    if (!envConfig.SESSION_SECRET || envConfig.SESSION_SECRET.length < 32) {
      console.warn(`⚠️ SESSION_SECRET em ${app} deveria ter pelo menos 32 caracteres`);
    }
  }

  return true;
}

function verifyAll() {
  console.log('🔐 VERIFICAÇÃO DE VARIÁVEIS DE AMBIENTE');
  console.log('='.repeat(50));

  const apiOk = verifyEnv('api');
  const webOk = verifyEnv('web');

  console.log('\n📊 RESULTADO:');
  console.log(`API: ${apiOk ? '✅ OK' : '❌ FALHA'}`);
  console.log(`Web: ${webOk ? '✅ OK' : '❌ FALHA'}`);

  if (!apiOk || !webOk) {
    console.log('\n💡 PRÓXIMOS PASSOS:');
    console.log('1. Copie os arquivos .env.example para .env');
    console.log('2. Configure as variáveis obrigatórias');
    console.log('3. Execute novamente este script');
    process.exit(1);
  }

  console.log('\n🎉 Todas as variáveis de ambiente estão configuradas!');
}

// Executar se chamado diretamente
if (import.meta.url.startsWith('file:') && process.argv[1].endsWith('verify-env.js')) {
  verifyAll();
}

export { verifyEnv, verifyAll };
