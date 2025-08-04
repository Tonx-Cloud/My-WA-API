// Script para remover BOM de todos os package.json do monorepo
const fs = require('fs');
const paths = [
  '../../package.json',
  '../../packages/shared/package.json',
  '../../packages/database/package.json',
  '../../apps/api/package.json',
  './package.json'
];

paths.forEach((relPath) => {
  const filePath = require('path').join(__dirname, relPath);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath);
    if (content[0] === 0xef && content[1] === 0xbb && content[2] === 0xbf) {
      content = content.slice(3);
      fs.writeFileSync(filePath, content);
      console.log(`BOM removido: ${filePath}`);
    } else {
      console.log(`Nenhum BOM encontrado: ${filePath}`);
    }
  }
});
