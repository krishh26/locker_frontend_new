export const timeAgo = (timestamp: string | null | undefined): string => {
  if (!timestamp) return "";

  const now = new Date();
  const past = new Date(timestamp);
  const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);

  const minutes = Math.floor(diffInSeconds / 60);
  const hours = Math.floor(diffInSeconds / 3600);
  const days = Math.floor(diffInSeconds / 86400);
  const weeks = Math.floor(diffInSeconds / 604800);

  if (diffInSeconds < 60) {
    return "Just now";
  } else if (minutes < 60) {
    return `${minutes} min${minutes !== 1 ? "s" : ""} ago`;
  } else if (hours < 24) {
    return `${hours} hour${hours !== 1 ? "s" : ""} ago`;
  } else if (days < 7) {
    return `${days} day${days !== 1 ? "s" : ""} ago`;
  } else {
    return `${weeks} week${weeks !== 1 ? "s" : ""} ago`;
  }
};

