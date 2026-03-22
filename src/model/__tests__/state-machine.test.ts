import { describe, it, expect } from 'vitest';
import { validateTransition, assertTransition, type TaskStatus } from '../types.js';

describe('validateTransition', () => {
  const validCases: [TaskStatus, TaskStatus][] = [
    ['pending', 'running'],
    ['pending', 'cancelled'],
    ['running', 'done'],
    ['running', 'failed'],
    ['running', 'cancelled'],
  ];

  for (const [from, to] of validCases) {
    it(`allows ${from} → ${to}`, () => {
      expect(validateTransition(from, to)).toBe(true);
    });
  }

  const invalidCases: [TaskStatus, TaskStatus][] = [
    ['pending', 'done'],
    ['pending', 'failed'],
    ['pending', 'pending'],
    ['running', 'pending'],
    ['running', 'running'],
    ['done', 'pending'],
    ['done', 'running'],
    ['done', 'failed'],
    ['done', 'cancelled'],
    ['failed', 'pending'],
    ['failed', 'running'],
    ['failed', 'done'],
    ['failed', 'cancelled'],
    ['cancelled', 'pending'],
    ['cancelled', 'running'],
    ['cancelled', 'done'],
    ['cancelled', 'failed'],
  ];

  for (const [from, to] of invalidCases) {
    it(`rejects ${from} → ${to}`, () => {
      expect(validateTransition(from, to)).toBe(false);
    });
  }
});

describe('assertTransition', () => {
  it('does not throw on valid transition', () => {
    expect(() => assertTransition('pending', 'running')).not.toThrow();
  });

  it('throws on invalid transition', () => {
    expect(() => assertTransition('done', 'running')).toThrow('Invalid state transition');
  });
});
