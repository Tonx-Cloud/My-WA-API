/**
 * Script de Verificação de Rotas
 * Verifica e mapeia todas as rotas da API e do Web
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const checkRoutes = () => {
  console.log('🛣️ VERIFICAÇÃO DE ROTAS');
  console.log('='.repeat(50));

  const apiRoutes = [];
  const webRoutes = [];

  // Verificar rotas da API
  console.log('\n📡 Verificando rotas da API...');
  const apiRoutesPath = path.join(__dirname, '../apps/api/src/routes');

  if (fs.existsSync(apiRoutesPath)) {
    const routeFiles = fs
      .readdirSync(apiRoutesPath)
      .filter(file => file.endsWith('.ts') || file.endsWith('.js'));

    routeFiles.forEach(file => {
      const routeName = file.replace(/\.(ts|js)$/, '');
      const routePath = `/api/${routeName}`;
      apiRoutes.push(routePath);
      console.log(`   ✅ ${routePath}`);
    });
  } else {
    console.error('❌ Diretório de rotas da API não encontrado');
  }

  // Verificar rotas do Web (Next.js App Router)
  console.log('\n🌐 Verificando rotas do Web...');
  const webRoutesPath = path.join(__dirname, '../apps/web/src/app');

  const scanDirectory = (dir, basePath = '') => {
    if (!fs.existsSync(dir)) return;

    const items = fs.readdirSync(dir);

    items.forEach(item => {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        // Pular diretórios especiais do Next.js
        if (item.startsWith('(') || item.startsWith('[')) {
          scanDirectory(fullPath, basePath);
          return;
        }

        // Verificar se há page.tsx ou page.js
        const pageFiles = ['page.tsx', 'page.js', 'route.ts', 'route.js'];
        const hasPage = pageFiles.some(pageFile => fs.existsSync(path.join(fullPath, pageFile)));

        if (hasPage) {
          const routePath = basePath ? `/${basePath}/${item}` : `/${item}`;
          if (item !== 'api') {
            // Não incluir rotas de API do Next.js
            webRoutes.push(routePath);
            console.log(`   ✅ ${routePath}`);
          }
        }

        // Recursão para subdiretórios
        const newBasePath = basePath ? `${basePath}/${item}` : item;
        scanDirectory(fullPath, newBasePath);
      }
    });
  };

  // Verificar rota raiz
  const rootPageFiles = ['page.tsx', 'page.js'];
  const hasRootPage = rootPageFiles.some(pageFile =>
    fs.existsSync(path.join(webRoutesPath, pageFile))
  );

  if (hasRootPage) {
    webRoutes.push('/');
    console.log('   ✅ /');
  }

  scanDirectory(webRoutesPath);

  // Verificar rotas de API do Next.js
  console.log('\n🔗 Verificando rotas de API do Next.js...');
  const nextApiPath = path.join(webRoutesPath, 'api');

  const scanApiDirectory = (dir, basePath = '/api') => {
    if (!fs.existsSync(dir)) return;

    const items = fs.readdirSync(dir);

    items.forEach(item => {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        const routePath = `${basePath}/${item}`;

        // Verificar se há route.ts ou route.js
        const routeFiles = ['route.ts', 'route.js'];
        const hasRoute = routeFiles.some(routeFile =>
          fs.existsSync(path.join(fullPath, routeFile))
        );

        if (hasRoute) {
          webRoutes.push(routePath);
          console.log(`   ✅ ${routePath}`);
        }

        // Recursão
        scanApiDirectory(fullPath, routePath);
      }
    });
  };

  scanApiDirectory(nextApiPath);

  // Relatório final
  console.log('\n📊 RESUMO DAS ROTAS:');
  console.log(`📡 API Express: ${apiRoutes.length} rotas`);
  console.log(`🌐 Next.js: ${webRoutes.length} rotas`);
  console.log(`🔗 Total: ${apiRoutes.length + webRoutes.length} rotas`);

  const allRoutes = {
    api: apiRoutes.sort(),
    web: webRoutes.sort(),
    total: apiRoutes.length + webRoutes.length,
  };

  // Salvar relatório
  const reportPath = path.join(__dirname, '../logs/routes-report.json');
  const logsDir = path.dirname(reportPath);

  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }

  fs.writeFileSync(reportPath, JSON.stringify(allRoutes, null, 2));
  console.log(`\n📄 Relatório salvo em: ${reportPath}`);

  return allRoutes;
};

// Executar se chamado diretamente
if (import.meta.url.startsWith('file:') && process.argv[1].endsWith('verify-routes.js')) {
  checkRoutes();
}

export default checkRoutes;
