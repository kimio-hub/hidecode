// ─── Security Scanner ──────────────────────────────────────────
// Scans tool inputs/outputs for secrets, PII, and dangerous patterns.

export interface ScanResult {
  clean: boolean;
  findings: Finding[];
}

export interface Finding {
  type: 'secret' | 'pii' | 'dangerous_path' | 'dangerous_command';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  redacted?: string;
}

// ─── Secret Patterns ───────────────────────────────────────────
const SECRET_PATTERNS: { name: string; pattern: RegExp; severity: Finding['severity'] }[] = [
  { name: 'AWS Key', pattern: /AKIA[0-9A-Z]{16}/g, severity: 'critical' },
  { name: 'OpenAI Key', pattern: /sk-[a-zA-Z0-9]{20,}/g, severity: 'critical' },
  { name: 'GitHub Token', pattern: /gh[pousr]_[A-Za-z0-9_]{36,}/g, severity: 'critical' },
  { name: 'Private Key', pattern: /-----BEGIN\s+(RSA|EC|DSA|OPENSSH)\s+PRIVATE\s+KEY-----/g, severity: 'critical' },
  { name: 'Generic Secret', pattern: /(?:password|secret|token|api_key)\s*[:=]\s*['"][^'"]{8,}['"]/gi, severity: 'high' },
  { name: 'Bearer Token', pattern: /Bearer\s+[A-Za-z0-9\-._~+/]+=*/g, severity: 'high' },
  { name: 'Connection String', pattern: /(?:mongodb|postgres|mysql|redis):\/\/[^\s'"]+/gi, severity: 'high' },
];

// ─── PII Patterns ──────────────────────────────────────────────
const PII_PATTERNS: { name: string; pattern: RegExp; severity: Finding['severity'] }[] = [
  { name: 'Email', pattern: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, severity: 'medium' },
  { name: 'Phone (US)', pattern: /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, severity: 'low' },
  { name: 'SSN', pattern: /\b\d{3}-\d{2}-\d{4}\b/g, severity: 'critical' },
  { name: 'Credit Card', pattern: /\b(?:\d{4}[-\s]?){3}\d{4}\b/g, severity: 'high' },
];

// ─── Dangerous Paths ───────────────────────────────────────────
const DANGEROUS_PATHS = [
  /\/etc\/(passwd|shadow|sudoers)/,
  /\.ssh\/(id_rsa|id_ed25519|authorized_keys)/,
  /\.env\b/,
  /\.aws\/credentials/,
  /\.kube\/config/,
  /node_modules\//,
];

// ─── Dangerous Commands ────────────────────────────────────────
const DANGEROUS_COMMANDS = [
  { pattern: /\brm\s+-rf\s+\/\s*$/, severity: 'critical' as const, message: 'Recursive delete from root' },
  { pattern: /\bsudo\b/, severity: 'high' as const, message: 'Sudo command' },
  { pattern: /\bcurl\b.*\|\s*(ba)?sh/, severity: 'critical' as const, message: 'Pipe to shell' },
  { pattern: /\bwget\b.*\|\s*(ba)?sh/, severity: 'critical' as const, message: 'Pipe to shell' },
  { pattern: /\bmkfs\b/, severity: 'critical' as const, message: 'Filesystem format' },
  { pattern: /\bdd\s+if=/, severity: 'critical' as const, message: 'Raw disk write' },
  { pattern: /\bchmod\s+777\b/, severity: 'high' as const, message: 'World-writable permissions' },
  { pattern: /\bgit\s+push\s+.*--force\b/, severity: 'high' as const, message: 'Force push' },
];

// ─── Scanner ───────────────────────────────────────────────────
export function scanText(text: string, context?: string): ScanResult {
  const findings: Finding[] = [];

  for (const { name, pattern, severity } of SECRET_PATTERNS) {
    const matches = text.match(pattern);
    if (matches) {
      for (const match of matches) {
        findings.push({
          type: 'secret',
          severity,
          message: `${name} detected${context ? ` in ${context}` : ''}`,
          redacted: match.slice(0, 4) + '***' + match.slice(-4),
        });
      }
    }
  }

  for (const { name, pattern, severity } of PII_PATTERNS) {
    const matches = text.match(pattern);
    if (matches) {
      for (const match of matches) {
        findings.push({
          type: 'pii',
          severity,
          message: `${name} detected${context ? ` in ${context}` : ''}`,
          redacted: '***REDACTED***',
        });
      }
    }
  }

  return { clean: findings.length === 0, findings };
}

export function scanPath(filePath: string): ScanResult {
  const findings: Finding[] = [];

  for (const pattern of DANGEROUS_PATHS) {
    if (pattern.test(filePath)) {
      findings.push({
        type: 'dangerous_path',
        severity: 'high',
        message: `Access to sensitive path: ${filePath}`,
      });
    }
  }

  return { clean: findings.length === 0, findings };
}

export function scanCommand(command: string): ScanResult {
  const findings: Finding[] = [];

  for (const { pattern, severity, message } of DANGEROUS_COMMANDS) {
    if (pattern.test(command)) {
      findings.push({
        type: 'dangerous_command',
        severity,
        message: `${message}: ${command.slice(0, 60)}`,
      });
    }
  }

  return { clean: findings.length === 0, findings };
}

export function scanToolInput(tool: string, input: Record<string, unknown>): ScanResult {
  const findings: Finding[] = [];

  // Scan all string values
  for (const [key, value] of Object.entries(input)) {
    if (typeof value === 'string') {
      const textResult = scanText(value, `${tool}.${key}`);
      findings.push(...textResult.findings);

      if (key === 'path' || key === 'file' || key === 'root') {
        const pathResult = scanPath(value);
        findings.push(...pathResult.findings);
      }

      if (key === 'command' || key === 'cmd') {
        const cmdResult = scanCommand(value);
        findings.push(...cmdResult.findings);
      }
    }
  }

  return { clean: findings.length === 0, findings };
}

export function redactSensitive(text: string): string {
  let result = text;
  for (const { pattern } of SECRET_PATTERNS) {
    result = result.replace(pattern, (match) => match.slice(0, 4) + '***REDACTED***');
  }
  for (const { pattern } of PII_PATTERNS) {
    result = result.replace(pattern, '***REDACTED***');
  }
  return result;
}
