import { formatDistanceToNow, format } from 'date-fns';

/**
 * Format a date as relative time ("4m ago", "2h ago").
 */
export const timeAgo = (date) => {
  if (!date) return '';
  try {
    return formatDistanceToNow(new Date(date), { addSuffix: true });
  } catch {
    return '';
  }
};

/**
 * Format a date as "Jun 20, 2026".
 */
export const formatDate = (date) => {
  if (!date) return '';
  try {
    return format(new Date(date), 'MMM d, yyyy');
  } catch {
    return '';
  }
};

/**
 * Format a date as "2026-06-20".
 */
export const formatDateShort = (date) => {
  if (!date) return '';
  try {
    return format(new Date(date), 'yyyy-MM-dd');
  } catch {
    return '';
  }
};

/**
 * Get a human-readable event type label.
 */
export const eventTypeLabel = (type) => {
  const labels = {
    NEW_VIDEO: 'New Video',
    TITLE_CHANGED: 'Title Changed',
    THUMBNAIL_CHANGED: 'Thumbnail Changed',
    CHANNEL_RENAMED: 'Channel Renamed',
    PROFILE_PICTURE_CHANGED: 'Avatar Changed',
  };
  return labels[type] || type;
};

/**
 * Get event type CSS class.
 */
export const eventTypeBadgeClass = (type) => {
  const classes = {
    NEW_VIDEO: 'event-badge-new-video',
    TITLE_CHANGED: 'event-badge-title-changed',
    THUMBNAIL_CHANGED: 'event-badge-thumbnail-changed',
    CHANNEL_RENAMED: 'event-badge-channel-renamed',
    PROFILE_PICTURE_CHANGED: 'event-badge-profile-pic',
  };
  return classes[type] || '';
};

/**
 * Get event type emoji icon.
 */
export const eventTypeIcon = (type) => {
  const icons = {
    NEW_VIDEO: '🎬',
    TITLE_CHANGED: '✏️',
    THUMBNAIL_CHANGED: '🖼️',
    CHANNEL_RENAMED: '📛',
    PROFILE_PICTURE_CHANGED: '👤',
  };
  return icons[type] || '📌';
};

/**
 * Truncate text to a max length.
 */
export const truncate = (text, maxLength = 60) => {
  if (!text) return '';
  return text.length > maxLength ? text.slice(0, maxLength) + '...' : text;
};
