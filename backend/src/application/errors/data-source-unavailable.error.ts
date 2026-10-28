export type DataSourceFailure =
  | 'timeout'
  | 'network'
  | 'server-error'
  | 'empty-response'
  | 'invalid-response';

export class DataSourceUnavailableError extends Error {
  readonly code = 'UPSTREAM_UNAVAILABLE';

  constructor(
    readonly reason: DataSourceFailure,
    readonly resource: string,
    message?: string,
  ) {
    super(
      message ??
        `Data source unavailable (${reason}) while loading ${resource}.`,
    );
    this.name = new.target.name;
  }
}
