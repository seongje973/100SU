/**
 * Milliseconds to formatted string (HH:MM:SS or MM:SS)
 */
export function formatDuration(ms: number): string {
  if (isNaN(ms) || ms <= 0) return "00:00";
  const seconds = Math.floor((ms / 1000) % 60);
  const minutes = Math.floor((ms / (1000 * 60)) % 60);
  const hours = Math.floor(ms / (1000 * 60 * 60));

  const formattedSeconds = String(seconds).padStart(2, "0");
  const formattedMinutes = String(minutes).padStart(2, "0");
  const formattedHours = String(hours).padStart(2, "0");

  return hours > 0
    ? `${formattedHours}:${formattedMinutes}:${formattedSeconds}`
    : `${formattedMinutes}:${formattedSeconds}`;
}

/**
 * Split an array into chunks of a specific size
 */
export function chunkArray<T>(array: T[], size: number): T[][] {
  const chunked: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunked.push(array.slice(i, i + size));
  }
  return chunked;
}

/**
 * Generate a visual progress bar for audio playback
 */
export function createProgressBar(current: number, total: number, size = 15): string {
  if (total <= 0) return "🔘" + "▬".repeat(size - 1);
  const progress = Math.min(Math.max(current / total, 0), 1);
  const progressIndex = Math.round(progress * size);
  
  const bar = "▬".repeat(progressIndex) + "🔘" + "▬".repeat(Math.max(size - progressIndex - 1, 0));
  return bar;
}
