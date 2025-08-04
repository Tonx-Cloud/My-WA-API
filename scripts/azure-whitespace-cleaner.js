#!/usr/bin/env node

/**
 * ðŸ§¹ TRAILING WHITESPACE CLEANER
 * Ferramenta Azure-ready para limpeza completa de whitespace
 * Baseado em Azure best practices para CI/CD
 */

import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

class WhitespaceCleanupService {
  constructor() {
    this.processed = 0;
    this.cleaned = 0;
    this.errors = 0;
    this.startTime = Date.now();
  }

  /**
   * Azure Best Practice: Cleanup com retry logic
   */
  async cleanFile(filePath) {
    const maxRetries = 3;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        const lines = content.split('\n');
        let hasChanges = false;

        const cleanedLines = lines.map(line => {
          const trimmed = line.replace(/\s+$/, '');
          if (trimmed !== line) {
            hasChanges = true;
          }
          return trimmed;
        });

        if (hasChanges) {
          const cleanedContent = cleanedLines.join('\n');
          fs.writeFileSync(filePath, cleanedContent, 'utf8');
          this.cleaned++;
          console.log(`âœ… Cleaned: ${filePath}`);
        }

        this.processed++;
        return true;
      } catch (error) {
        if (attempt === maxRetries - 1) {
          console.error(`âŒ Error cleaning ${filePath}:`, error.message);
          this.errors++;
          return false;
        }

        // Exponential backoff (Azure pattern)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 100));
      }
    }
  }

  /**
   * Azure Pattern: Batch processing with concurrency control
   */
  async cleanupAll() {
    console.log('ðŸš€ INICIANDO LIMPEZA DE TRAILING WHITESPACE');
    console.log('ðŸ”§ Usando padrÃµes Azure para processamento em lote\n');

    const patterns = [
      '**/*.{ts,tsx,js,jsx}',
      '**/*.{md,json,yml,yaml}',
      '**/*.{css,scss,html}',
      '**/*.{txt,log}',
    ];

    const excludePatterns = [
      'node_modules/**',
      '.git/**',
      'dist/**',
      'build/**',
      'coverage/**',
      '.next/**',
      'logs/**/*.log',
      'data/**',
      'uploads/**',
    ];

    for (const pattern of patterns) {
      console.log(`ðŸ“‚ Processando padrÃ£o: ${pattern}`);

      try {
        const files = await glob(pattern, {
          ignore: excludePatterns,
          absolute: true,
        });

        console.log(`ðŸ“„ Encontrados ${files.length} arquivos`);

        // Azure Pattern: Process in batches to avoid overwhelming system
        const batchSize = 10;
        for (let i = 0; i < files.length; i += batchSize) {
          const batch = files.slice(i, i + batchSize);
          await Promise.all(batch.map(file => this.cleanFile(file)));

          // Progress indicator
          const progress = Math.round(((i + batchSize) / files.length) * 100);
          process.stdout.write(`\râ³ Progresso: ${Math.min(progress, 100)}%`);
        }

        console.log(); // New line
      } catch (error) {
        console.error(`âŒ Erro no padrÃ£o ${pattern}:`, error.message);
      }
    }

    this.printSummary();
  }

  printSummary() {
    const duration = Date.now() - this.startTime;

    console.log('\nðŸ“Š RELATÃ“RIO DE LIMPEZA');
    console.log('====================================');
    console.log(`ðŸ“„ Arquivos processados: ${this.processed}`);
    console.log(`âœ… Arquivos limpos: ${this.cleaned}`);
    console.log(`âŒ Erros: ${this.errors}`);
    console.log(`â±ï¸  DuraÃ§Ã£o: ${(duration / 1000).toFixed(2)}s`);
    console.log(
      `ðŸš€ Taxa de sucesso: ${(((this.processed - this.errors) / this.processed) * 100).toFixed(1)}%`
    );

    if (this.cleaned > 0) {
      console.log('\nðŸŽ‰ TRAILING WHITESPACE ELIMINADO!');
      console.log('âœ… Projeto pronto para Azure deployment');
    } else {
      console.log('\nâœ¨ Nenhum trailing whitespace encontrado');
      console.log('âœ… Projeto jÃ¡ estÃ¡ limpo');
    }
  }
}

// Execute cleanup
(async () => {
  const cleaner = new WhitespaceCleanupService();
  await cleaner.cleanupAll();
})().catch(console.error);
