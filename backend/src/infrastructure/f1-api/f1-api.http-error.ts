export class F1ApiHttpError extends Error {
  constructor(
    readonly status: number,
    readonly code: string | undefined,
    readonly path: string,
  ) {
    super(`F1 API responded ${status} (${code ?? 'no code'}) for ${path}.`);
    this.name = new.target.name;
  }
}
