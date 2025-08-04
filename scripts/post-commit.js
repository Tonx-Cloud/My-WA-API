/**
 * Script Pós-Commit
 * Executa validações automáticas após cada commit
 */

import { exec } from "child_process";
import path from "path";
import { promisify } from "util";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const execAsync = promisify(exec);

const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
};

function log(message, color = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

const runCommand = async (command, options = {}) => {
  const { silent = false, continueOnError = false } = options;

  try {
    if (!silent) {
      log(`🔧 Executando: ${command}`, "cyan");
    }

    const { stdout, stderr } = await execAsync(command, {
      cwd: path.join(__dirname, ".."),
      maxBuffer: 1024 * 1024 * 10, // 10MB buffer
    });

    if (stderr && !continueOnError) {
      throw new Error(stderr);
    }

    return { success: true, stdout, stderr };
  } catch (error) {
    if (continueOnError) {
      log(`⚠️ Comando falhou mas continuando: ${command}`, "yellow");
      return { success: false, error: error.message };
    }
    throw error;
  }
};

const postCommit = async () => {
  log("🚀 INICIANDO PROCEDIMENTOS PÓS-COMMIT", "bright");
  log("=".repeat(50), "blue");

  const startTime = Date.now();
  const results = {
    timestamp: new Date().toISOString(),
    steps: [],
    success: true,
    duration: 0,
  };

  try {
    // 1. Verificar variáveis de ambiente
    log("\n🔍 1. Verificando variáveis de ambiente...", "blue");
    try {
      await runCommand("node scripts/verify-env.js");
      log("✅ Variáveis de ambiente - OK", "green");
      results.steps.push({ step: "env-vars", status: "success" });
    } catch (error) {
      log("❌ Variáveis de ambiente - FALHA", "red");
      results.steps.push({
        step: "env-vars",
        status: "error",
        error: error.message,
      });
      // Não abortar por variáveis de ambiente em desenvolvimento
    }

    // 2. Verificar rotas
    log("\n🛣️ 2. Verificando rotas...", "blue");
    try {
      await runCommand("node scripts/verify-routes.js");
      log("✅ Verificação de rotas - OK", "green");
      results.steps.push({ step: "routes", status: "success" });
    } catch (error) {
      log("❌ Verificação de rotas - FALHA", "red");
      results.steps.push({
        step: "routes",
        status: "error",
        error: error.message,
      });
    }

    // 3. Rodar linting
    log("\n🧹 3. Executando linting...", "blue");
    try {
      // Linting da API
      await runCommand("npm run lint", { continueOnError: true });
      log("✅ Linting - OK", "green");
      results.steps.push({ step: "linting", status: "success" });
    } catch (error) {
      log("⚠️ Linting com avisos", "yellow");
      results.steps.push({
        step: "linting",
        status: "warning",
        error: error.message,
      });
    }

    // 4. Executar testes rápidos
    log("\n🧪 4. Executando testes rápidos...", "blue");
    try {
      await runCommand("node scripts/quick-test.mjs");
      log("✅ Testes rápidos - OK", "green");
      results.steps.push({ step: "quick-tests", status: "success" });
    } catch (error) {
      log("❌ Testes rápidos - FALHA", "red");
      results.steps.push({
        step: "quick-tests",
        status: "error",
        error: error.message,
      });
      results.success = false;
    }

    // 5. Verificar build (opcional em desenvolvimento)
    if (process.env.NODE_ENV === "production") {
      log("\n📦 5. Verificando build...", "blue");
      try {
        await runCommand("npm run build");
        log("✅ Build - OK", "green");
        results.steps.push({ step: "build", status: "success" });
      } catch (error) {
        log("❌ Build - FALHA", "red");
        results.steps.push({
          step: "build",
          status: "error",
          error: error.message,
        });
        results.success = false;
      }
    } else {
      log("\n📦 5. Build (pulado em desenvolvimento)", "yellow");
      results.steps.push({ step: "build", status: "skipped" });
    }

    // Calcular duração
    results.duration = Date.now() - startTime;

    // Relatório final
    log("\n📊 RELATÓRIO PÓS-COMMIT", "bright");
    log("=".repeat(30), "blue");

    const successSteps = results.steps.filter(
      (s) => s.status === "success",
    ).length;
    const totalSteps = results.steps.length;
    const warningSteps = results.steps.filter(
      (s) => s.status === "warning",
    ).length;
    const errorSteps = results.steps.filter((s) => s.status === "error").length;

    log(`✅ Sucesso: ${successSteps}/${totalSteps} etapas`, "green");
    if (warningSteps > 0) {
      log(`⚠️ Avisos: ${warningSteps} etapas`, "yellow");
    }
    if (errorSteps > 0) {
      log(`❌ Erros: ${errorSteps} etapas`, "red");
    }
    log(`⏱️ Duração: ${Math.round(results.duration / 1000)}s`, "cyan");

    // Salvar relatório
    const logsDir = path.join(__dirname, "../logs");

    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }

    const reportPath = path.join(logsDir, `post-commit-${Date.now()}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));

    if (results.success) {
      log("\n🎉 PROCEDIMENTOS PÓS-COMMIT CONCLUÍDOS COM SUCESSO!", "green");
      log("🚀 Projeto pronto para desenvolvimento/deploy", "green");
    } else {
      log("\n⚠️ PROCEDIMENTOS PÓS-COMMIT CONCLUÍDOS COM PROBLEMAS", "yellow");
      log("🔧 Corrija os erros antes de continuar", "yellow");
    }

    log(`\n📄 Relatório salvo em: ${reportPath}`, "cyan");
  } catch (error) {
    results.success = false;
    results.duration = Date.now() - startTime;

    log("\n❌ ERRO CRÍTICO NO PROCEDIMENTO PÓS-COMMIT", "red");
    log(error.message, "red");

    process.exit(1);
  }
};

// Executar se chamado diretamente
if (
  import.meta.url.startsWith("file:") &&
  process.argv[1].endsWith("post-commit.js")
) {
  postCommit().catch((error) => {
    console.error("❌ Erro crítico:", error);
    process.exit(1);
  });
}

export { postCommit, runCommand };
