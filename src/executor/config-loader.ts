import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

export interface ToolsConfig {
  default: string[];
  profiles: Record<string, string[] | '__all__'>;
}

export interface ResolvedTools {
  tools: string[];
  dangerouslySkipPermissions: boolean;
}

const DEFAULT_CONFIG_PATH = resolve(process.cwd(), 'config/allowed-tools.json');

let cachedConfig: ToolsConfig | null = null;
let cachedPath: string | null = null;

export function loadToolsConfig(configPath?: string): ToolsConfig {
  const path = configPath ?? DEFAULT_CONFIG_PATH;

  // Simple cache: re-read if path changed
  if (cachedConfig && cachedPath === path) {
    return cachedConfig;
  }

  const raw = readFileSync(path, 'utf-8');
  const parsed = JSON.parse(raw) as ToolsConfig;

  if (!Array.isArray(parsed.default)) {
    throw new Error('Invalid config: "default" must be an array of tool names');
  }

  cachedConfig = parsed;
  cachedPath = path;
  return parsed;
}

export function resolveTools(
  options: { toolProfile?: string; allowedTools?: string[] },
  configPath?: string,
): ResolvedTools {
  // Explicit tool list takes priority
  if (options.allowedTools && options.allowedTools.length > 0) {
    return { tools: options.allowedTools, dangerouslySkipPermissions: false };
  }

  const config = loadToolsConfig(configPath);
  const profileName = options.toolProfile ?? 'default';

  if (profileName === 'default') {
    return { tools: config.default, dangerouslySkipPermissions: false };
  }

  const profile = config.profiles[profileName];
  if (profile === undefined) {
    throw new Error(`Unknown tool profile: "${profileName}". Available: ${Object.keys(config.profiles).join(', ')}`);
  }

  if (profile === '__all__') {
    return { tools: [], dangerouslySkipPermissions: true };
  }

  return { tools: profile, dangerouslySkipPermissions: false };
}

export function clearConfigCache(): void {
  cachedConfig = null;
  cachedPath = null;
}
