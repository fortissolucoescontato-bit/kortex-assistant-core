import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export interface ShellResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

export class ShellTool {
  private allowedPaths: string[];
  private blockedCommands: string[] = [
    "rm -rf /",
    "mkfs",
    "dd if=",
    "> /dev/",
    "shutdown",
    "reboot",
    "format",
    ":(){ :|:& };:" // Fork bomb
  ];

  constructor(allowedPaths: string[] = [process.cwd()]) {
    this.allowedPaths = allowedPaths;
  }

  /**
   * Executa um comando bash de forma segura.
   */
  async execute(command: string, timeoutMs: number = 30000): Promise<ShellResult> {
    // 1. Verificar comandos bloqueados
    if (this.isBlocked(command)) {
      throw new Error(`Comando bloqueado por segurança: ${command}`);
    }

    try {
      const { stdout, stderr } = await execAsync(command, {
        timeout: timeoutMs,
        cwd: this.allowedPaths[0], // Executa sempre no diretório principal ou sandbox
        maxBuffer: 1024 * 1024, // 1MB
      });

      return {
        stdout: stdout.trim(),
        stderr: stderr.trim(),
        exitCode: 0
      };
    } catch (error: any) {
      return {
        stdout: error.stdout?.trim() || "",
        stderr: error.stderr?.trim() || error.message,
        exitCode: error.code || 1
      };
    }
  }

  private isBlocked(command: string): boolean {
    const lowerCmd = command.toLowerCase();
    return this.blockedCommands.some(blocked => lowerCmd.includes(blocked));
  }
}
