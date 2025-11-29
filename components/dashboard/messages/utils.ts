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

// Helper function to format message timestamp
// Shows "Just now" if under 1 minute, time if under 24 hours, date if over 24 hours
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

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    // Show "Just now" if under 1 minute
    if (diffMins < 1) {
      return locale === 'en' ? 'Just now' : 'الآن';
    }
    
    // Show date if over 24 hours
    if (diffDays >= 1) {
      return date.toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US', {
        month: 'short',
        day: 'numeric',
        year: diffDays >= 365 ? 'numeric' : undefined,
      });
    }

    // Show time (hour:minute) for messages between 1 minute and 24 hours
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

// Validation functions for message restrictions
export interface MessageValidationResult {
  isValid: boolean;
  restrictionType: 'phone' | 'email' | 'link' | null;
  message: string;
}

/**
 * Validates message text for restricted content (phone numbers, emails, external links)
 */
export const validateMessageText = (
  text: string,
  locale: string
): MessageValidationResult => {
  if (!text || !text.trim()) {
    return { isValid: true, restrictionType: null, message: '' };
  }

  // Check for phone numbers
  // Matches various phone formats with high confidence:
  // - International: +1234567890, +1-234-567-8900, +1 (234) 567-8900
  // - Local with separators: 123-456-7890, (123) 456-7890, 123.456.7890
  // - With spaces: 123 456 7890, +1 234 567 8900
  // - Arabic/International: 05xxxxxxxx, 00966xxxxxxxxx, etc.
  // - Long digit sequences (10+ digits) that look like phone numbers
  const phonePatterns = [
    // International formats with country code and separators
    /\+?\d{1,4}[\s.-]?\(?\d{1,4}\)?[\s.-]?\d{1,4}[\s.-]?\d{1,9}/g,
    // US-style with separators: 123-456-7890, (123) 456-7890
    /\b\d{3}[\s.-]?\d{3}[\s.-]?\d{4}\b/g,
    // Alternative format: 1234-567-890
    /\b\d{4}[\s.-]?\d{3}[\s.-]?\d{3}\b/g,
    // Saudi/local formats: 05xxxxxxxx (9-10 digits)
    /\b0[1-9]\d{8,9}\b/g,
    // Saudi international format: 00966xxxxxxxxx
    /\b00966\d{9}\b/g,
    // Long sequences of 10-15 digits (likely phone numbers)
    /\b\d{10,15}\b/g,
  ];

  for (const pattern of phonePatterns) {
    const matches = text.match(pattern);
    if (matches && matches.some(match => {
      const digitsOnly = match.replace(/\D/g, '');
      const digitsLength = digitsOnly.length;
      
      // Phone numbers typically have 7-15 digits
      if (digitsLength < 7 || digitsLength > 15) return false;
      
      // Exclude years (1900-2099) - 4 digits
      if (digitsLength === 4 && /^(19|20)\d{2}$/.test(digitsOnly)) return false;
      
      // Exclude very short numbers
      if (digitsLength <= 3) return false;
      
      // If pattern has separators, country code, or parentheses, it's likely a phone number
      if (match.includes('+') || match.includes('-') || match.includes('(') || 
          match.includes(')') || (match.includes(' ') && digitsLength >= 7)) {
        return true;
      }
      
      // For long digit sequences (10+ digits), very likely a phone number
      if (digitsLength >= 10) return true;
      
      // For 7-9 digit sequences starting with 0 (common for local numbers)
      if (digitsLength >= 7 && digitsLength <= 9 && digitsOnly.startsWith('0')) {
        return true;
      }
      
      return false;
    })) {
      return {
        isValid: false,
        restrictionType: 'phone',
        message:
          locale === 'en'
            ? 'Phone numbers are not allowed in messages. Please remove any phone numbers before sending.'
            : 'لا يُسمح بأرقام الهواتف في الرسائل. يرجى إزالة أي أرقام هواتف قبل الإرسال.',
      };
    }
  }

  // Check for email addresses
  const emailPattern =
    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
  if (emailPattern.test(text)) {
    return {
      isValid: false,
      restrictionType: 'email',
      message:
        locale === 'en'
          ? 'Email addresses are not allowed in messages. Please remove any email addresses before sending.'
          : 'لا يُسمح بعناوين البريد الإلكتروني في الرسائل. يرجى إزالة أي عناوين بريد إلكتروني قبل الإرسال.',
    };
  }

  // Check for external links/URLs
  // Matches http://, https://, www., and common domain patterns
  const urlPatterns = [
    /https?:\/\/[^\s]+/gi, // http:// or https://
    /www\.[^\s]+/gi, // www.
    /\b[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(?:\/[^\s]*)?/gi, // domain.com or domain.com/path
  ];

  for (const pattern of urlPatterns) {
    if (pattern.test(text)) {
      // Additional check to avoid false positives (like "a.com" in regular text)
      const matches = text.match(pattern);
      if (matches && matches.some(match => {
        const cleanMatch = match.toLowerCase().trim();
        // Exclude common false positives
        const falsePositives = ['e.g.', 'i.e.', 'etc.', 'vs.', 'mr.', 'mrs.', 'dr.', 'prof.'];
        if (falsePositives.some(fp => cleanMatch.includes(fp))) return false;
        
        // Check if it looks like a real URL
        return cleanMatch.includes('://') || 
               cleanMatch.startsWith('www.') || 
               (cleanMatch.includes('.') && cleanMatch.length > 4);
      })) {
        return {
          isValid: false,
          restrictionType: 'link',
          message:
            locale === 'en'
              ? 'External links are not allowed in messages. Please remove any links before sending.'
              : 'لا يُسمح بالروابط الخارجية في الرسائل. يرجى إزالة أي روابط قبل الإرسال.',
        };
      }
    }
  }

  return { isValid: true, restrictionType: null, message: '' };
};

