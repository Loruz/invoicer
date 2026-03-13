export function formatDuration(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const pad = (n: number) => n.toString().padStart(2, "0");

  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

export function formatDurationShort(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  if (hours === 0) return `${minutes}m`;
  return `${hours}h ${minutes}m`;
}

export function calculateElapsed(startTime: string | Date): number {
  const start = new Date(startTime).getTime();
  const now = Date.now();
  return Math.max(0, Math.floor((now - start) / 1000));
}

export function formatCurrency(
  amountInCents: number,
  currencyCode: string,
): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currencyCode,
    minimumFractionDigits: 2,
  }).format(amountInCents / 100);
}
