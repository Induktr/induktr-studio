import { DatabaseSync } from 'node:sqlite';

export class Database {
  private db: DatabaseSync;

  constructor(path = ':memory:') {
    this.db = new DatabaseSync(path);
  }

  run(sql: string): void {
    this.db.exec(sql);
  }

  prepare<R = unknown, P extends unknown[] = unknown[]>(sql: string) {
    const stmt = this.db.prepare(sql);
    return {
      get: (...params: P) => stmt.get(...(params as unknown as Parameters<typeof stmt.get>)) as R | undefined,
      all: (...params: P) => stmt.all(...(params as unknown as Parameters<typeof stmt.all>)) as R[],
      run: (...params: P) => stmt.run(...(params as unknown as Parameters<typeof stmt.run>)),
      finalize: () => {},
    };
  }

  close(): void {
    this.db.close();
  }
}

export type Statement<R = unknown, P extends unknown[] = unknown[]> = {
  get: (...params: P) => R | undefined;
  all: (...params: P) => R[];
  run: (...params: P) => void;
  finalize?: () => void;
};
