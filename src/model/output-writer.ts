import { createWriteStream, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import type { WriteStream } from 'node:fs';
import type { StreamEvent } from '../executor/types.js';

const DEFAULT_OUTPUT_DIR = 'data/outputs';

export class OutputWriter {
  private stream: WriteStream | null = null;
  private filePath: string;

  constructor(taskId: string, outputDir: string = DEFAULT_OUTPUT_DIR) {
    this.filePath = join(outputDir, `${taskId}.jsonl`);
    mkdirSync(dirname(this.filePath), { recursive: true });
  }

  get path(): string {
    return this.filePath;
  }

  write(event: StreamEvent): void {
    if (!this.stream) {
      this.stream = createWriteStream(this.filePath, { flags: 'a' });
    }
    this.stream.write(JSON.stringify(event) + '\n');
  }

  close(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.stream) {
        resolve();
        return;
      }
      this.stream.end(() => {
        this.stream = null;
        resolve();
      });
    });
  }
}
