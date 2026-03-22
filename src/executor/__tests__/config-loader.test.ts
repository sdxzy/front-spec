import { describe, it, expect, beforeEach, vi } from 'vitest';
import { writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { loadToolsConfig, resolveTools, clearConfigCache } from '../config-loader.js';

const TMP_DIR = join(tmpdir(), 'config-loader-test-' + Date.now());
const CONFIG_PATH = join(TMP_DIR, 'allowed-tools.json');

function writeConfig(config: object) {
  writeFileSync(CONFIG_PATH, JSON.stringify(config));
}

beforeEach(() => {
  clearConfigCache();
  mkdirSync(TMP_DIR, { recursive: true });
});

describe('loadToolsConfig', () => {
  it('loads a valid config file', () => {
    writeConfig({
      default: ['Read', 'Write'],
      profiles: { readonly: ['Read'], dangerous: '__all__' },
    });
    const config = loadToolsConfig(CONFIG_PATH);
    expect(config.default).toEqual(['Read', 'Write']);
    expect(config.profiles.readonly).toEqual(['Read']);
  });

  it('throws on missing file', () => {
    expect(() => loadToolsConfig('/nonexistent/path.json')).toThrow();
  });

  it('throws on invalid config (default not array)', () => {
    writeConfig({ default: 'not-an-array', profiles: {} });
    expect(() => loadToolsConfig(CONFIG_PATH)).toThrow('must be an array');
  });
});

describe('resolveTools', () => {
  beforeEach(() => {
    writeConfig({
      default: ['Read', 'Write', 'Edit'],
      profiles: {
        readonly: ['Read'],
        full: ['Read', 'Write', 'Edit', 'Bash', 'Agent'],
        dangerous: '__all__',
      },
    });
  });

  it('returns default profile when no options specified', () => {
    const result = resolveTools({}, CONFIG_PATH);
    expect(result.tools).toEqual(['Read', 'Write', 'Edit']);
    expect(result.dangerouslySkipPermissions).toBe(false);
  });

  it('returns named profile', () => {
    const result = resolveTools({ toolProfile: 'readonly' }, CONFIG_PATH);
    expect(result.tools).toEqual(['Read']);
    expect(result.dangerouslySkipPermissions).toBe(false);
  });

  it('returns dangerouslySkipPermissions for __all__ profile', () => {
    const result = resolveTools({ toolProfile: 'dangerous' }, CONFIG_PATH);
    expect(result.tools).toEqual([]);
    expect(result.dangerouslySkipPermissions).toBe(true);
  });

  it('explicit allowedTools overrides profile', () => {
    const result = resolveTools(
      { toolProfile: 'readonly', allowedTools: ['Bash', 'Grep'] },
      CONFIG_PATH,
    );
    expect(result.tools).toEqual(['Bash', 'Grep']);
    expect(result.dangerouslySkipPermissions).toBe(false);
  });

  it('throws on unknown profile', () => {
    expect(() => resolveTools({ toolProfile: 'nonexistent' }, CONFIG_PATH)).toThrow(
      'Unknown tool profile',
    );
  });
});
