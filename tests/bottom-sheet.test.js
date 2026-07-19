import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createBottomSheet } from '../src/ui/bottom-sheet.js';

beforeEach(() => {
  vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: true, addEventListener: vi.fn() })));
});

describe('mobile map and detail sheet', () => {
  it('offers explicit map and detail controls without requiring a swipe', () => {
    const content = document.createElement('div');
    const sheet = createBottomSheet(content);
    document.body.append(sheet.element);

    expect(sheet.element.dataset.state).toBe('peek');
    sheet.element.querySelector('.sheet-map-button').click();
    expect(sheet.element.dataset.state).toBe('map');
    expect(content.inert).toBe(true);
    expect(content.getAttribute('aria-hidden')).toBe('true');

    sheet.element.querySelector('.sheet-handle').click();
    expect(sheet.element.dataset.state).toBe('peek');
    expect(content.inert).toBe(false);
    sheet.element.querySelector('.sheet-handle').click();
    expect(sheet.element.dataset.state).toBe('full');
  });

  it('keeps a direct close action for selected tree details', () => {
    const onClose = vi.fn();
    const sheet = createBottomSheet(document.createElement('div'));
    sheet.onClose(onClose);
    sheet.setSelectionActive(true);
    const close = sheet.element.querySelector('.sheet-close');
    expect(close.hidden).toBe(false);
    close.click();
    expect(onClose).toHaveBeenCalledOnce();
  });
});
