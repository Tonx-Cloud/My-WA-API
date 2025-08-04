import express from "express";
import cors from "cors";
import helmet from "helmet";
import session from "express-session";
import passport from "passport";
import { Server } from "socket.io";
import { createServer } from "http";

// Importar middlewares
import { rateLimiter } from "./middleware/rateLimiter";
import { errorMiddleware } from "./middleware/enhanced-error-handler";
import { httpLogger } from "./config/enhanced-logger";
import { performanceMiddleware } from "./middleware/performance";

// Importar rotas
import authRoutes from "./routes/auth";
import instanceRoutes from "./routes/instances";
import messageRoutes from "./routes/messages";
import webhookRoutes from "./routes/webhooks";
import healthRoutes from "./routes/health";
import dashboardRoutes from "./routes/dashboard";
import alertRoutes from "./routes/alerts";
import backupRoutes from "./routes/backup";
import monitoringRoutes from "./routes/monitoring";
import xaiRoutes from "./routes/xai.routes";

export function createApp() {
  const app = express();

  // Configurações básicas
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'", "https:"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
        },
      },
    }),
  );

  app.use(
    cors({
      origin: process.env["FRONTEND_URL"] || "http://localhost:3001",
      credentials: true,
    }),
  );

  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true, limit: "10mb" }));

  // Logging HTTP
  app.use(httpLogger);

  // Performance monitoring
  app.use(performanceMiddleware);

  // Configuração de sessão
  app.use(
    session({
      secret: process.env["SESSION_SECRET"] || "default-secret-key",
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env["NODE_ENV"] === "production",
        maxAge: 24 * 60 * 60 * 1000, // 24 horas
      },
    }),
  );

  // Passport middleware
  app.use(passport.initialize());
  app.use(passport.session());

  // Rate limiting
  app.use(rateLimiter);

  // Rotas da API
  app.use("/api/auth", authRoutes);
  app.use("/api/instances", instanceRoutes);
  app.use("/api/messages", messageRoutes);
  app.use("/api/webhooks", webhookRoutes);
  app.use("/api/dashboard", dashboardRoutes);
  app.use("/api/alerts", alertRoutes);
  app.use("/api/backup", backupRoutes);
  app.use("/api/monitoring", monitoringRoutes);
  app.use("/api/xai", xaiRoutes);

  // Sistema de Health Check
  app.use("/health", healthRoutes);

  // Middleware de tratamento de erros (deve ser o último)
  app.use(errorMiddleware);

  return app;
}

export function createServerWithSocket(app: express.Application) {
  const server = createServer(app);
  const io = new Server(server, {
    cors: {
      origin: process.env["FRONTEND_URL"] || "http://localhost:3001",
      methods: ["GET", "POST"],
    },
  });

  return { server, io };
}
