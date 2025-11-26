// Helper function to format username (remove @ and _, capitalize)
export const formatUsername = (username: string): string => {
  if (!username) return '';
  // Remove @ and _ characters
  let formatted = username.replace(/[@_]/g, ' ');
  // Capitalize first letter of each word
  return formatted
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

// Helper function to safely parse and format date (for conversation list)
export const formatDate = (
  dateString: string | undefined | null,
  locale: string
): string => {
  if (!dateString) return '';

  try {
    const date = new Date(dateString);
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return '';
    }

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    // Show relative time for conversation list
    if (diffMins < 1) {
      return locale === 'en' ? 'Just now' : 'الآن';
    } else if (diffMins < 60) {
      return locale === 'en' ? `${diffMins}m ago` : `منذ ${diffMins} دقيقة`;
    } else if (diffHours < 24) {
      return locale === 'en' ? `${diffHours}h ago` : `منذ ${diffHours} ساعة`;
    } else if (diffDays < 7) {
      return locale === 'en' ? `${diffDays}d ago` : `منذ ${diffDays} يوم`;
    } else {
      // Show date if older than a week
      return date.toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US', {
        month: 'short',
        day: 'numeric',
      });
    }
  } catch (error) {
    console.error('Error formatting date:', error);
    return '';
  }
};

// Helper function to format message timestamp (always shows actual local time)
export const formatMessageTime = (
  dateString: string | undefined | null,
  locale: string
): string => {
  if (!dateString) return '';

  try {
    // Parse the date string - handles UTC and local timezone automatically
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return '';
    }

    // Always show actual local time in 12-hour format
    return date.toLocaleTimeString(locale === 'ar' ? 'ar-SA' : 'en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  } catch (error) {
    console.error('Error formatting message time:', error);
    return '';
  }
};

