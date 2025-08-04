const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

// Mapeamento de arquivos para testes
const fileToTestMap = {
  "apps/api/src/services/whatsappService.js":
    "apps/api/tests/services/whatsappService.test.js",
  "apps/api/src/services/backupService.js":
    "apps/api/tests/services/backupService.test.js",
  "apps/api/src/services/performanceService.js":
    "apps/api/tests/services/performanceService.test.js",
  "apps/api/src/middlewares/": "apps/api/tests/middlewares/",
  "apps/api/src/controllers/": "apps/api/tests/integration/",
  "apps/api/src/routes/": "apps/api/tests/integration/",
  "apps/web/src/": "apps/web/src/__tests__/",
  "packages/shared/src/": "packages/shared/tests/",
};

// Cores para console
const colors = {
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  reset: "\x1b[0m",
  bold: "\x1b[1m",
};

function log(message, color = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Função para obter arquivos alterados
function getChangedFiles() {
  try {
    log("🔍 Verificando arquivos alterados...", "blue");
    const output = execSync("git diff --name-only HEAD~1 HEAD", {
      encoding: "utf8",
    });
    const files = output.split("\n").filter((file) => file.trim() !== "");

    if (files.length === 0) {
      log("ℹ️  Tentando comparar com staging area...", "yellow");
      const stagedOutput = execSync("git diff --name-only --cached", {
        encoding: "utf8",
      });
      return stagedOutput.split("\n").filter((file) => file.trim() !== "");
    }

    return files;
  } catch (error) {
    log("⚠️  Não foi possível obter arquivos alterados via Git", "yellow");
    log("   Motivo: " + error.message, "red");
    return [];
  }
}

// Função para mapear arquivos para testes
function mapFilesToTests(files) {
  const testsToRun = new Set();

  files.forEach((file) => {
    log(`   📄 Analisando: ${file}`, "blue");

    for (const [pattern, testPath] of Object.entries(fileToTestMap)) {
      if (file.includes(pattern)) {
        testsToRun.add(testPath);
        log(`   ✅ Mapeado para: ${testPath}`, "green");
      }
    }
  });

  return Array.from(testsToRun);
}

// Função para verificar se arquivos de teste existem
function filterExistingTests(testPaths) {
  return testPaths.filter((testPath) => {
    const exists =
      fs.existsSync(testPath) || fs.existsSync(path.dirname(testPath));
    if (!exists) {
      log(`   ⚠️  Teste não encontrado: ${testPath}`, "yellow");
    }
    return exists;
  });
}

// Função para executar testes
function runTests(testPaths = []) {
  try {
    if (testPaths.length === 0) {
      log("🧪 Executando todos os testes...", "bold");
      execSync("npm test", { stdio: "inherit", cwd: "apps/api" });
    } else {
      log(
        `🎯 Executando testes específicos (${testPaths.length} arquivos)...`,
        "bold",
      );
      testPaths.forEach((testPath) => {
        log(`   🧪 ${testPath}`, "blue");
      });

      // Executar testes por workspace
      const apiTests = testPaths.filter((p) => p.includes("apps/api"));
      const webTests = testPaths.filter((p) => p.includes("apps/web"));
      const sharedTests = testPaths.filter((p) =>
        p.includes("packages/shared"),
      );

      if (apiTests.length > 0) {
        log("\n📦 Executando testes da API...", "green");
        const apiTestPattern = apiTests
          .map((t) => t.replace("apps/api/", ""))
          .join("|");
        execSync(`npm test -- --testPathPattern="${apiTestPattern}"`, {
          stdio: "inherit",
          cwd: "apps/api",
        });
      }

      if (webTests.length > 0) {
        log("\n🌐 Executando testes do Web...", "green");
        const webTestPattern = webTests
          .map((t) => t.replace("apps/web/", ""))
          .join("|");
        execSync(`npm test -- --testPathPattern="${webTestPattern}"`, {
          stdio: "inherit",
          cwd: "apps/web",
        });
      }

      if (sharedTests.length > 0) {
        log("\n📚 Executando testes do Shared...", "green");
        execSync("npm test", { stdio: "inherit", cwd: "packages/shared" });
      }
    }

    log("\n✅ Testes concluídos com sucesso!", "green");
  } catch (error) {
    log("\n❌ Falha na execução dos testes!", "red");
    log("   Código de saída: " + error.status, "red");
    process.exit(error.status || 1);
  }
}

// Função principal
function runChangedTests() {
  log("🚀 Iniciando teste de arquivos alterados...", "bold");

  const changedFiles = getChangedFiles();

  if (changedFiles.length === 0) {
    log("\n📝 Nenhum arquivo alterado detectado.", "yellow");
    log("   Executando todos os testes...", "yellow");
    runTests();
    return;
  }

  log(`\n📋 Arquivos alterados detectados (${changedFiles.length}):`, "green");
  changedFiles.forEach((file) => {
    log(`   • ${file}`, "blue");
  });

  log("\n🔗 Mapeando arquivos para testes...", "blue");
  const testsToRun = mapFilesToTests(changedFiles);

  if (testsToRun.length === 0) {
    log(
      "\n⚠️  Nenhum teste específico mapeado para os arquivos alterados.",
      "yellow",
    );
    log("   Executando todos os testes por segurança...", "yellow");
    runTests();
    return;
  }

  log(`\n✅ Testes mapeados (${testsToRun.length}):`, "green");
  const existingTests = filterExistingTests(testsToRun);

  if (existingTests.length === 0) {
    log("\n⚠️  Nenhum arquivo de teste existe ainda.", "yellow");
    log("   Executando todos os testes...", "yellow");
    runTests();
  } else {
    runTests(existingTests);
  }
}

// Verificar se é execução direta
if (require.main === module) {
  runChangedTests();
}

module.exports = {
  runChangedTests,
  getChangedFiles,
  mapFilesToTests,
};
