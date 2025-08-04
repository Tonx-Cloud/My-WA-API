const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

// Cores para console
const colors = {
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
  magenta: "\x1b[35m",
  reset: "\x1b[0m",
  bold: "\x1b[1m",
};

function log(message, color = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Configuração dos testes de regressão
const regressionTests = {
  api: {
    workspace: "apps/api",
    tests: [
      "tests/services/whatsappService.test.js",
      "tests/services/backupService.test.js",
      "tests/services/performanceService.test.js",
      "tests/infrastructure/imports.test.js",
      "tests/middlewares/validation.test.js",
      "tests/integration/api.test.js",
    ],
    critical: [
      "tests/services/whatsappService.test.js",
      "tests/services/backupService.test.js",
    ],
  },
  web: {
    workspace: "apps/web",
    tests: [
      "src/__tests__/components/ErrorBoundary.test.tsx",
      "src/__tests__/lib/logger.test.ts",
      "src/__tests__/pages/dashboard.test.tsx",
    ],
    critical: ["src/__tests__/components/ErrorBoundary.test.tsx"],
  },
  shared: {
    workspace: "packages/shared",
    tests: ["tests/types.test.ts", "tests/utils.test.ts"],
    critical: ["tests/types.test.ts"],
  },
};

// Função para verificar saúde do projeto
function checkProjectHealth() {
  log("🏥 Verificando saúde do projeto...", "blue");

  const healthChecks = [
    {
      name: "Node.js Version",
      check: () => {
        const version = process.version;
        const major = parseInt(version.slice(1).split(".")[0]);
        return major >= 18;
      },
      info: `Versão atual: ${process.version}`,
    },
    {
      name: "Package.json files",
      check: () => {
        return [
          "apps/api/package.json",
          "apps/web/package.json",
          "packages/shared/package.json",
        ].every((file) => fs.existsSync(file));
      },
      info: "Verificando estrutura de monorepo",
    },
    {
      name: "Dependencies installed",
      check: () => {
        return ["apps/api/node_modules", "apps/web/node_modules"].every((dir) =>
          fs.existsSync(dir),
        );
      },
      info: "Verificando node_modules",
    },
  ];

  let allHealthy = true;

  healthChecks.forEach((check) => {
    const result = check.check();
    const status = result ? "✅" : "❌";
    log(`   ${status} ${check.name}: ${check.info}`, result ? "green" : "red");
    if (!result) allHealthy = false;
  });

  return allHealthy;
}

// Função para executar testes em um workspace
async function runWorkspaceTests(workspaceName, config, mode = "full") {
  log(`\n📦 Executando testes: ${workspaceName.toUpperCase()}`, "bold");

  const testsToRun = mode === "critical" ? config.critical : config.tests;
  const existingTests = testsToRun.filter((test) => {
    const testPath = path.join(config.workspace, test);
    return fs.existsSync(testPath);
  });

  if (existingTests.length === 0) {
    log(`   ⚠️  Nenhum teste encontrado em ${workspaceName}`, "yellow");
    return { passed: 0, failed: 0, skipped: testsToRun.length };
  }

  log(
    `   🧪 Executando ${existingTests.length} de ${testsToRun.length} testes...`,
    "blue",
  );

  try {
    // Preparar comando baseado no workspace
    let testCommand;
    if (workspaceName === "api") {
      testCommand = "npm test";
    } else if (workspaceName === "web") {
      testCommand = "npm test";
    } else if (workspaceName === "shared") {
      testCommand = "npm test";
    }

    log(`   🚀 Comando: ${testCommand}`, "cyan");

    // Executar testes
    const output = execSync(testCommand, {
      cwd: config.workspace,
      encoding: "utf8",
      stdio: "pipe",
    });

    // Processar output para extrair métricas
    const metrics = parseTestOutput(output);

    log(`   ✅ Sucesso: ${metrics.passed} testes passaram`, "green");
    if (metrics.failed > 0) {
      log(`   ❌ Falhas: ${metrics.failed} testes falharam`, "red");
    }
    if (metrics.skipped > 0) {
      log(`   ⏭️  Pulados: ${metrics.skipped} testes foram pulados`, "yellow");
    }

    return metrics;
  } catch (error) {
    log(`   ❌ Erro na execução dos testes de ${workspaceName}`, "red");
    log(`   📝 Código de saída: ${error.status}`, "red");

    // Tentar extrair informações do erro
    const errorOutput = error.stdout || error.stderr || "";
    const metrics = parseTestOutput(errorOutput);

    return {
      passed: metrics.passed,
      failed: metrics.failed || 1,
      skipped: metrics.skipped,
    };
  }
}

// Função para fazer parse do output dos testes
function parseTestOutput(output) {
  const metrics = { passed: 0, failed: 0, skipped: 0 };

  // Padrões para Jest
  const passedMatch = output.match(/(\d+) passed/);
  const failedMatch = output.match(/(\d+) failed/);
  const skippedMatch = output.match(/(\d+) skipped/);
  const todoMatch = output.match(/(\d+) todo/);

  if (passedMatch) metrics.passed = parseInt(passedMatch[1]);
  if (failedMatch) metrics.failed = parseInt(failedMatch[1]);
  if (skippedMatch) metrics.skipped = parseInt(skippedMatch[1]);
  if (todoMatch) metrics.skipped += parseInt(todoMatch[1]);

  return metrics;
}

// Função para gerar relatório de cobertura
function generateCoverageReport() {
  log("\n📊 Gerando relatório de cobertura...", "blue");

  const workspaces = ["apps/api", "apps/web"];
  const coverageData = [];

  workspaces.forEach((workspace) => {
    try {
      log(`   📈 Cobertura para ${workspace}...`, "cyan");

      execSync("npm run test:coverage", {
        cwd: workspace,
        stdio: "pipe",
      });

      // Verificar se arquivo de cobertura existe
      const coveragePath = path.join(
        workspace,
        "coverage/coverage-summary.json",
      );
      if (fs.existsSync(coveragePath)) {
        const coverage = JSON.parse(fs.readFileSync(coveragePath, "utf8"));
        coverageData.push({
          workspace,
          coverage: coverage.total,
        });
      }
    } catch (error) {
      log(
        `   ⚠️  Não foi possível gerar cobertura para ${workspace}`,
        "yellow",
      );
    }
  });

  // Exibir relatório de cobertura
  if (coverageData.length > 0) {
    log("\n📋 Relatório de Cobertura:", "bold");
    coverageData.forEach(({ workspace, coverage }) => {
      log(`\n   📦 ${workspace}:`, "blue");
      log(`      Lines: ${coverage.lines.pct}%`, "cyan");
      log(`      Functions: ${coverage.functions.pct}%`, "cyan");
      log(`      Branches: ${coverage.branches.pct}%`, "cyan");
      log(`      Statements: ${coverage.statements.pct}%`, "cyan");
    });
  }

  return coverageData;
}

// Função principal para executar testes de regressão
async function runRegressionTests(mode = "full") {
  log("🧪 INICIANDO TESTES DE REGRESSÃO", "bold");
  log(`📋 Modo: ${mode.toUpperCase()}`, "blue");
  log(`🕐 Horário: ${new Date().toLocaleString("pt-BR")}`, "cyan");

  // Verificar saúde do projeto
  if (!checkProjectHealth()) {
    log("\n❌ Projeto não está saudável. Abortando testes.", "red");
    process.exit(1);
  }

  // Inicializar métricas
  const overallMetrics = { passed: 0, failed: 0, skipped: 0 };
  const results = [];

  // Executar testes para cada workspace
  for (const [workspaceName, config] of Object.entries(regressionTests)) {
    try {
      const metrics = await runWorkspaceTests(workspaceName, config, mode);
      results.push({ workspace: workspaceName, ...metrics });

      // Acumular métricas
      overallMetrics.passed += metrics.passed;
      overallMetrics.failed += metrics.failed;
      overallMetrics.skipped += metrics.skipped;
    } catch (error) {
      log(
        `\n❌ Erro crítico no workspace ${workspaceName}: ${error.message}`,
        "red",
      );
      results.push({
        workspace: workspaceName,
        passed: 0,
        failed: 1,
        skipped: 0,
        error: error.message,
      });
      overallMetrics.failed += 1;
    }
  }

  // Gerar relatório de cobertura se solicitado
  let coverageData = [];
  if (mode === "full") {
    coverageData = generateCoverageReport();
  }

  // Exibir relatório final
  log("\n📋 RELATÓRIO FINAL DE REGRESSÃO", "bold");
  log("═".repeat(50), "blue");

  results.forEach((result) => {
    const status = result.failed === 0 ? "✅" : "❌";
    log(
      `${status} ${result.workspace.toUpperCase()}: ${result.passed} ✅ | ${result.failed} ❌ | ${result.skipped} ⏭️`,
      result.failed === 0 ? "green" : "red",
    );

    if (result.error) {
      log(`   ⚠️  Erro: ${result.error}`, "yellow");
    }
  });

  log("\n📊 RESUMO GERAL:", "bold");
  log(
    `   Total de testes executados: ${overallMetrics.passed + overallMetrics.failed}`,
    "blue",
  );
  log(`   ✅ Sucessos: ${overallMetrics.passed}`, "green");
  log(
    `   ❌ Falhas: ${overallMetrics.failed}`,
    overallMetrics.failed > 0 ? "red" : "green",
  );
  log(`   ⏭️  Pulados: ${overallMetrics.skipped}`, "yellow");

  const successRate =
    (overallMetrics.passed / (overallMetrics.passed + overallMetrics.failed)) *
    100;
  log(
    `   📈 Taxa de sucesso: ${successRate.toFixed(1)}%`,
    successRate >= 90 ? "green" : "red",
  );

  // Determinar código de saída
  const exitCode = overallMetrics.failed > 0 ? 1 : 0;

  if (exitCode === 0) {
    log("\n🎉 TODOS OS TESTES DE REGRESSÃO PASSARAM!", "green");
  } else {
    log("\n💥 FALHAS DETECTADAS NOS TESTES DE REGRESSÃO!", "red");
  }

  log(`\n🏁 Finalizado em ${new Date().toLocaleString("pt-BR")}`, "cyan");

  return { exitCode, metrics: overallMetrics, results, coverage: coverageData };
}

// CLI
if (require.main === module) {
  const mode = process.argv[2] || "full"; // full, critical

  runRegressionTests(mode)
    .then(({ exitCode }) => {
      process.exit(exitCode);
    })
    .catch((error) => {
      log(`\n💥 Erro fatal: ${error.message}`, "red");
      console.error(error);
      process.exit(1);
    });
}

module.exports = {
  runRegressionTests,
  checkProjectHealth,
  generateCoverageReport,
};
