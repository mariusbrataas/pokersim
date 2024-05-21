export default function workerLoader() {
  return new Worker(new URL('./worker.ts', import.meta.url), {
    type: 'module'
  });
}
