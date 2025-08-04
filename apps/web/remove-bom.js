// Script para remover BOM do package.json
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'package.json');
let content = fs.readFileSync(filePath);

// Remove BOM se existir
if (content[0] === 0xef && content[1] === 0xbb && content[2] === 0xbf) {
  content = content.slice(3);
  fs.writeFileSync(filePath, content);
  console.log('BOM removido com sucesso!');
} else {
  console.log('Nenhum BOM encontrado.');
}
