import { saveAs } from 'file-saver';

export function downloadBlob(blob: Blob, filename: string): void {
  saveAs(blob, filename);
}

export function downloadText(content: string, filename: string, mimeType = 'text/plain'): void {
  const blob = new Blob([content], { type: mimeType });
  downloadBlob(blob, filename);
}

export function downloadJson(data: any, filename: string): void {
  const content = JSON.stringify(data, null, 2);
  downloadText(content, filename, 'application/json');
}
