export class Logger {
  private prefix: string;

  constructor(prefix: string = 'MCP') {
    this.prefix = prefix;
  }

  log(...args: any[]) {
    console.log(`[${this.prefix}]`, ...args);
  }

  error(...args: any[]) {
    console.error(`[${this.prefix}:ERROR]`, ...args);
  }

  info(...args: any[]) {
    console.log(`[${this.prefix}:INFO]`, ...args);
  }

  debug(...args: any[]) {
    if (process.env.DEBUG) {
      console.log(`[${this.prefix}:DEBUG]`, ...args);
    }
  }
}

export const logger = new Logger('Dashboard-Testing-MCP');