// Script para remover BOM de todos os package.json do monorepo (Windows root)
const fs = require('fs');
const path = require('path');

const base = 'c:/Projetos/My-wa-api';
const files = [
  'package.json',
  'packages/shared/package.json',
  'packages/database/package.json',
  'apps/api/package.json',
  'apps/web/package.json'
];

files.forEach(f => {
  const filePath = path.join(base, f);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath);
    if (content[0] === 0xef && content[1] === 0xbb && content[2] === 0xbf) {
      content = content.slice(3);
      fs.writeFileSync(filePath, content);
      console.log('BOM removido:', filePath);
    } else {
      console.log('Nenhum BOM encontrado:', filePath);
    }
  }
});
