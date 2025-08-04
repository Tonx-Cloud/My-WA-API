// Logger para o frontend Next.js adaptado do enhanced-logger
// Otimizado para debugging de React error #130

interface LogContext {
  userId?: string;
  sessionId?: string;
  userAgent?: string;
  url?: string;
  component?: string;
  props?: any;
  state?: any;
  [key: string]: any;
}

interface ReactErrorInfo {
  componentStack?: string | undefined;
  errorBoundary?: string | undefined;
  errorInfo?: any;
}

// Configuração de log levels
const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3,
} as const;

type LogLevel = keyof typeof LOG_LEVELS;

class FrontendLogger {
  private isDevelopment: boolean;
  private logLevel: LogLevel;

  constructor() {
    this.isDevelopment = process.env.NODE_ENV === "development";
    this.logLevel =
      (process.env["NEXT_PUBLIC_LOG_LEVEL"] as LogLevel) || "INFO";
  }

  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVELS[level] <= LOG_LEVELS[this.logLevel];
  }

  private formatLog(level: LogLevel, message: string, context?: any) {
    const timestamp = new Date().toISOString();
    const baseLog = {
      timestamp,
      level,
      message,
      context,
      userAgent:
        typeof navigator !== "undefined" ? navigator.userAgent : undefined,
      url: typeof window !== "undefined" ? window.location.href : undefined,
      sessionId: this.getSessionId(),
    };

    return baseLog;
  }

  private getSessionId(): string {
    if (typeof window === "undefined") return "server-side";

    let sessionId = sessionStorage.getItem("debug-session-id");
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
      sessionStorage.setItem("debug-session-id", sessionId);
    }
    return sessionId;
  }

  private sendToConsole(level: LogLevel, formattedLog: any) {
    if (!this.shouldLog(level)) return;

    const consoleMethod =
      level === "ERROR"
        ? "error"
        : level === "WARN"
          ? "warn"
          : level === "DEBUG"
            ? "debug"
            : "log";

    if (this.isDevelopment) {
      console.group(`🔍 [${level}] ${formattedLog.message}`);
      console[consoleMethod]("Detalhes:", formattedLog);
      if (formattedLog.context) {
        console.log("Contexto:", formattedLog.context);
      }
      console.groupEnd();
    } else {
      console[consoleMethod](
        `[${level}] ${formattedLog.message}`,
        formattedLog.context,
      );
    }
  }

  private async sendToAPI(logData: any) {
    try {
      // Enviar logs críticos para a API em produção
      if (!this.isDevelopment && logData.level === "ERROR") {
        await fetch("/api/logs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(logData),
        }).catch(() => {
          // Silenciosamente falhar se a API não estiver disponível
        });
      }
    } catch (error) {
      // Não fazer nada se falhar ao enviar logs
    }
  }

  error(message: string | Error, context?: LogContext) {
    const errorMessage = message instanceof Error ? message.message : message;
    const errorContext =
      message instanceof Error
        ? {
            ...context,
            error: {
              name: message.name,
              message: message.message,
              stack: message.stack,
            },
          }
        : context;

    const formattedLog = this.formatLog("ERROR", errorMessage, errorContext);
    this.sendToConsole("ERROR", formattedLog);
    this.sendToAPI(formattedLog);
  }

  warn(message: string, context?: LogContext) {
    const formattedLog = this.formatLog("WARN", message, context);
    this.sendToConsole("WARN", formattedLog);
  }

  info(message: string, context?: LogContext) {
    const formattedLog = this.formatLog("INFO", message, context);
    this.sendToConsole("INFO", formattedLog);
  }

  debug(message: string, context?: LogContext) {
    const formattedLog = this.formatLog("DEBUG", message, context);
    this.sendToConsole("DEBUG", formattedLog);
  }

  // Método específico para erros React #130
  reactError(error: Error, errorInfo: ReactErrorInfo, context?: LogContext) {
    const reactContext = {
      ...context,
      type: "react_error",
      errorCode: 130,
      reactErrorInfo: errorInfo,
      componentStack: errorInfo.componentStack,
      errorBoundary: errorInfo.errorBoundary,
      possibleCauses: [
        "Componente renderizando objeto ao invés de JSX",
        "Props undefined causando erro de renderização",
        "Componente não retornando JSX válido",
        "Hook chamado fora de componente React",
        "Estado inconsistente causando re-render inválido",
      ],
    };

    this.error(`React Error #130: ${error.message}`, reactContext);
  }

  // Método para erros de autenticação NextAuth
  authError(error: Error, context?: LogContext) {
    const authContext = {
      ...context,
      type: "auth_error",
      provider: context?.["provider"] || "unknown",
      authFlow: context?.["authFlow"] || "unknown",
    };

    this.error(`Auth Error: ${error.message}`, authContext);
  }

  // Método para erros de navegação/redirecionamento
  navigationError(
    error: Error,
    fromUrl?: string,
    toUrl?: string,
    context?: LogContext,
  ) {
    const navContext = {
      ...context,
      type: "navigation_error",
      fromUrl,
      toUrl,
      navigationType: context?.["navigationType"] || "unknown",
    };

    this.error(`Navigation Error: ${error.message}`, navContext);
  }

  // Método para debugging de componentes
  componentDebug(componentName: string, props: any, state?: any) {
    if (!this.isDevelopment) return;

    this.debug(`Component Debug: ${componentName}`, {
      type: "component_debug",
      componentName,
      props: this.sanitizeProps(props),
      state: state ? this.sanitizeProps(state) : undefined,
    });
  }

  // Método para tracking de eventos do usuário
  userEvent(eventName: string, eventData?: any) {
    this.info(`User Event: ${eventName}`, {
      type: "user_event",
      eventName,
      eventData,
    });
  }

  private sanitizeProps(props: any): any {
    try {
      // Remover funções e circular references para logging seguro
      return JSON.parse(
        JSON.stringify(props, (key, value) => {
          if (typeof value === "function") return "[Function]";
          if (value instanceof Error) return `[Error: ${value.message}]`;
          return value;
        }),
      );
    } catch (error) {
      return "[Complex Object - Could not serialize]";
    }
  }
}

// Singleton instance
export const logger = new FrontendLogger();

// Exports nomeados para conveniência
export const logError = logger.error.bind(logger);
export const logWarn = logger.warn.bind(logger);
export const logInfo = logger.info.bind(logger);
export const logDebug = logger.debug.bind(logger);
export const logReactError = logger.reactError.bind(logger);
export const logAuthError = logger.authError.bind(logger);
export const logNavigationError = logger.navigationError.bind(logger);
export const logComponentDebug = logger.componentDebug.bind(logger);
export const logUserEvent = logger.userEvent.bind(logger);

export default logger;
