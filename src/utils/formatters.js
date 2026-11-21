export function maskPhone(phone) {
  if (!phone) return null;
  const cleaned = String(phone).trim();
  if (cleaned.length <= 5) return '*****';
  // Show first 5 and mask the remaining
  return cleaned.substring(0, 5) + 'X'.repeat(Math.max(3, cleaned.length - 5));
}

export function isOlderThan6Hours(dateString) {
  if (!dateString) return false;
  const time = new Date(dateString).getTime();
  const diffHours = (Date.now() - time) / (1000 * 60 * 60);
  return diffHours > 6;
}

export function formatTimeAgo(dateString) {
  if (!dateString) return 'Unknown';
  const diffMs = Date.now() - new Date(dateString).getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);

  if (diffSec < 45) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDays = Math.floor(diffHr / 24);
  return `${diffDays}d ago`;
}
