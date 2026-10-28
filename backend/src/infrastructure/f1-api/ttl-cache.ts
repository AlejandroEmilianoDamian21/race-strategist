interface Entry {
  expiresAt: number;
  value: Promise<unknown>;
}

export class TtlCache {
  private readonly entries = new Map<string, Entry>();

  constructor(
    private readonly ttlMs: number,
    private readonly now: () => number = Date.now,
  ) {}

  getOrLoad<T>(key: string, loader: () => Promise<T>): Promise<T> {
    const cached = this.entries.get(key);
    if (cached && cached.expiresAt > this.now()) {
      return cached.value as Promise<T>;
    }

    const value = loader();
    const entry: Entry = { expiresAt: this.now() + this.ttlMs, value };
    this.entries.set(key, entry);
    value.catch(() => {
      if (this.entries.get(key) === entry) {
        this.entries.delete(key);
      }
    });
    return value;
  }

  clear(): void {
    this.entries.clear();
  }
}
