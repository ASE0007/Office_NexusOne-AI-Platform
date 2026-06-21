import { describe, it, expect } from 'vitest';
import { cn } from '@/utils/cn';

describe('cn (class name merge utility)', () => {
  it('merges multiple class strings', () => {
    expect(cn('px-2', 'py-1')).toBe('px-2 py-1');
  });

  it('handles conditional classes', () => {
    expect(cn('base', false && 'hidden', true && 'visible')).toBe('base visible');
  });

  it('resolves tailwind conflicts (later wins)', () => {
    // tailwind-merge should keep only the last conflicting utility
    expect(cn('px-2', 'px-4')).toBe('px-4');
  });

  it('handles undefined and null gracefully', () => {
    expect(cn('base', undefined, null, 'extra')).toBe('base extra');
  });

  it('returns empty string for no input', () => {
    expect(cn()).toBe('');
  });

  it('merges arrays of classes', () => {
    expect(cn(['px-2', 'py-1'], 'text-sm')).toBe('px-2 py-1 text-sm');
  });
});
