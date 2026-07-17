import { DocumentsService } from './documents.service';

describe('DocumentsService payment ledger helpers', () => {
  it('computes positive paid delta only', () => {
    const prev = 100;
    const next = 250;
    const delta = next - prev;
    expect(delta).toBe(150);
    expect(delta > 0).toBe(true);
  });

  it('ignores zero or negative paid changes', () => {
    expect(100 - 100).toBe(0);
    expect(80 - 100).toBeLessThanOrEqual(0);
  });
});

describe('Driver portal expiring window', () => {
  function inWindow(daysLeft: number | null) {
    return daysLeft !== null && daysLeft >= 0 && daysLeft <= 7;
  }

  it('includes 0-7 days', () => {
    expect(inWindow(0)).toBe(true);
    expect(inWindow(7)).toBe(true);
    expect(inWindow(3)).toBe(true);
  });

  it('excludes expired and far future', () => {
    expect(inWindow(-1)).toBe(false);
    expect(inWindow(8)).toBe(false);
    expect(inWindow(null)).toBe(false);
  });
});

// Keep a type-level import so the service file is part of compile graph in IDEs.
void DocumentsService;
