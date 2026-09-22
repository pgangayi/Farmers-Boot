import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  colorClasses,
  isDateValid,
  isOverdue,
  formatDate,
  formatStatus,
  getSelectedFarm,
  getStatusBadgeClasses,
  getPriorityBadgeClasses,
  loadBackgroundImage,
  trapFocus,
  logger,
} from './dashboard';

describe('colorClasses', () => {
  it('exposes all eight color variants', () => {
    expect(Object.keys(colorClasses).sort()).toEqual(
      ['amber', 'blue', 'emerald', 'green', 'orange', 'purple', 'red', 'yellow'].sort()
    );
  });

  it('each variant has bg, text and icon keys', () => {
    for (const variant of Object.values(colorClasses)) {
      expect(variant).toHaveProperty('bg');
      expect(variant).toHaveProperty('text');
      expect(variant).toHaveProperty('icon');
    }
  });

  it('green variant uses green classes', () => {
    expect(colorClasses.green.bg).toContain('green');
    expect(colorClasses.green.text).toContain('green');
  });
});

describe('isDateValid', () => {
  it('returns false for undefined or empty input', () => {
    expect(isDateValid(undefined)).toBe(false);
    expect(isDateValid('')).toBe(false);
  });

  it('returns true for valid ISO and human dates', () => {
    expect(isDateValid('2024-01-15')).toBe(true);
    expect(isDateValid('2024-01-15T10:00:00Z')).toBe(true);
    expect(isDateValid('January 15, 2024')).toBe(true);
  });

  it('returns false for garbage strings', () => {
    expect(isDateValid('not-a-date')).toBe(false);
    expect(isDateValid('32/13/2024')).toBe(false);
  });
});

describe('isOverdue', () => {
  it('returns false when date or status is missing', () => {
    expect(isOverdue(undefined, 'pending')).toBe(false);
    expect(isOverdue('2020-01-01', undefined)).toBe(false);
    expect(isOverdue(undefined, undefined)).toBe(false);
  });

  it('returns false for non-pending statuses even when date is past', () => {
    expect(isOverdue('2020-01-01', 'completed')).toBe(false);
    expect(isOverdue('2020-01-01', 'in_progress')).toBe(false);
  });

  it('returns true for past dates with pending status', () => {
    expect(isOverdue('2020-01-01', 'pending')).toBe(true);
  });

  it('returns false for future dates with pending status', () => {
    const future = new Date(Date.now() + 86400000).toISOString();
    expect(isOverdue(future, 'pending')).toBe(false);
  });

  it('returns false for invalid dates', () => {
    expect(isOverdue('garbage', 'pending')).toBe(false);
  });
});

describe('formatDate', () => {
  it('returns placeholder for missing input', () => {
    expect(formatDate(undefined)).toBe('Not specified');
  });

  it('returns Invalid date for unparsable input', () => {
    expect(formatDate('not-a-date')).toBe('Invalid date');
  });

  it('formats a valid date string', () => {
    const out = formatDate('2024-01-15');
    expect(out).not.toBe('Not specified');
    expect(out).not.toBe('Invalid date');
    expect(out.length).toBeGreaterThan(0);
  });
});

describe('formatStatus', () => {
  it('returns Unknown for missing input', () => {
    expect(formatStatus(undefined)).toBe('Unknown');
    expect(formatStatus('')).toBe('Unknown');
  });

  it('capitalizes single words', () => {
    expect(formatStatus('pending')).toBe('Pending');
    expect(formatStatus('completed')).toBe('Completed');
  });

  it('converts snake_case to Title Case', () => {
    expect(formatStatus('in_progress')).toBe('In Progress');
    expect(formatStatus('needs_attention')).toBe('Needs Attention');
  });
});

describe('getSelectedFarm', () => {
  const farms = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];

  it('returns undefined for empty list', () => {
    expect(getSelectedFarm([], 'a')).toBeUndefined();
    expect(getSelectedFarm(undefined as never, 'a')).toBeUndefined();
  });

  it('returns matching farm when id exists', () => {
    expect(getSelectedFarm(farms, 'b')).toEqual({ id: 'b' });
  });

  it('falls back to first farm when id missing or unknown', () => {
    expect(getSelectedFarm(farms, undefined)).toEqual({ id: 'a' });
    expect(getSelectedFarm(farms, 'unknown')).toEqual({ id: 'a' });
  });
});

describe('getStatusBadgeClasses', () => {
  it('maps crop statuses correctly', () => {
    expect(getStatusBadgeClasses('healthy', 'crop')).toContain('green');
    expect(getStatusBadgeClasses('needs attention', 'crop')).toContain('amber');
    expect(getStatusBadgeClasses('critical', 'crop')).toContain('red');
  });

  it('maps animal statuses correctly', () => {
    expect(getStatusBadgeClasses('active', 'animal')).toContain('green');
    expect(getStatusBadgeClasses('sold', 'animal')).toContain('orange');
    expect(getStatusBadgeClasses('deceased', 'animal')).toContain('red');
  });

  it('maps task statuses correctly', () => {
    expect(getStatusBadgeClasses('pending', 'task')).toContain('yellow');
    expect(getStatusBadgeClasses('in_progress', 'task')).toContain('blue');
    expect(getStatusBadgeClasses('completed', 'task')).toContain('green');
  });

  it('falls back to gray for unknown status or missing inputs', () => {
    expect(getStatusBadgeClasses('unknown', 'crop')).toContain('gray');
    expect(getStatusBadgeClasses(undefined, 'crop')).toContain('gray');
    expect(getStatusBadgeClasses('healthy', 'crop')).not.toContain('gray');
  });
});

describe('getPriorityBadgeClasses', () => {
  it('maps known priorities', () => {
    expect(getPriorityBadgeClasses('urgent')).toContain('red');
    expect(getPriorityBadgeClasses('high')).toContain('orange');
    expect(getPriorityBadgeClasses('normal')).toContain('blue');
    expect(getPriorityBadgeClasses('low')).toContain('gray');
  });

  it('falls back to gray for unknown priority', () => {
    expect(getPriorityBadgeClasses('whenever')).toContain('gray');
    expect(getPriorityBadgeClasses('')).toContain('gray');
  });
});

describe('loadBackgroundImage', () => {
  it('resolves true when image loads', async () => {
    const originalImage = global.Image;
    class FakeImage {
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      set src(_v: string) {
        queueMicrotask(() => this.onload?.());
      }
    }
    // @ts-expect-error jsdom Image mock
    global.Image = FakeImage;
    await expect(loadBackgroundImage('http://example.com/a.png')).resolves.toBe(true);
    global.Image = originalImage;
  });

  it('rejects when image errors', async () => {
    const originalImage = global.Image;
    class FakeImage {
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      set src(_v: string) {
        queueMicrotask(() => this.onerror?.());
      }
    }
    // @ts-expect-error jsdom Image mock
    global.Image = FakeImage;
    await expect(loadBackgroundImage('http://example.com/b.png')).rejects.toBe(false);
    global.Image = originalImage;
  });
});

describe('trapFocus', () => {
  it('ignores non-Tab keys', () => {
    const el = document.createElement('div');
    const event = new KeyboardEvent('keydown', { key: 'Enter' });
    const spy = vi.spyOn(event, 'preventDefault');
    trapFocus(el, event as KeyboardEvent);
    expect(spy).not.toHaveBeenCalled();
  });

  it('wraps from last to first on Tab', () => {
    const el = document.createElement('div');
    el.innerHTML = '<button id="a">a</button><button id="b">b</button>';
    document.body.appendChild(el);
    const first = el.querySelector('#a') as HTMLElement;
    const last = el.querySelector('#b') as HTMLElement;
    last.focus();
    expect(document.activeElement).toBe(last);

    const event = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true });
    const spy = vi.spyOn(event, 'preventDefault').mockImplementation(() => {});
    trapFocus(el, event as KeyboardEvent);
    expect(spy).toHaveBeenCalled();
    expect(document.activeElement).toBe(first);
    document.body.removeChild(el);
  });

  it('wraps from first to last on Shift+Tab', () => {
    const el = document.createElement('div');
    el.innerHTML = '<button id="a">a</button><button id="b">b</button>';
    document.body.appendChild(el);
    const first = el.querySelector('#a') as HTMLElement;
    const last = el.querySelector('#b') as HTMLElement;
    first.focus();

    const event = new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true });
    const spy = vi.spyOn(event, 'preventDefault').mockImplementation(() => {});
    trapFocus(el, event as KeyboardEvent);
    expect(spy).toHaveBeenCalled();
    expect(document.activeElement).toBe(last);
    document.body.removeChild(el);
  });
});

describe('logger', () => {
  let debugSpy: ReturnType<typeof vi.spyOn>;
  let errorSpy: ReturnType<typeof vi.spyOn>;
  let warnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    debugSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('exposes debug, error and warn functions', () => {
    expect(typeof logger.debug).toBe('function');
    expect(typeof logger.error).toBe('function');
    expect(typeof logger.warn).toBe('function');
  });

  it('forwards error and warn to console', () => {
    logger.error('boom');
    logger.warn('careful');
    expect(errorSpy).toHaveBeenCalled();
    expect(warnSpy).toHaveBeenCalled();
  });

  it('does not throw when logging in any mode', () => {
    expect(() => logger.debug('hi')).not.toThrow();
    expect(() => logger.error('hi')).not.toThrow();
    expect(() => logger.warn('hi')).not.toThrow();
  });
});
