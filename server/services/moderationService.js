/**
 * Content moderation service with Hebrew support
 */

// Hebrew and English profanity list
const badWords = [
    // Hebrew examples (add actual words as needed)
    'חרא', 'זין', 'כוס', 'מניאק', 'אידיוט',
    // English examples
    'fuck', 'shit', 'damn', 'ass', 'bitch', 'idiot', 'stupid'
];

/**
 * Check if text contains profanity
 */
export function containsProfanity(text) {
    const lowerText = text.toLowerCase();

    for (const word of badWords) {
        // Use word boundaries for better matching
        const regex = new RegExp(`\\b${word}\\b`, 'i');
        if (regex.test(lowerText)) {
            return true;
        }

        // Also check for the word appearing anywhere (for Hebrew which may not have clear boundaries)
        if (lowerText.includes(word.toLowerCase())) {
            return true;
        }
    }

    return false;
}

/**
 * Sanitize username - remove special characters
 */
export function sanitizeUsername(username) {
    // Allow Hebrew, English, numbers, and spaces
    return username.replace(/[^\u0590-\u05FFa-zA-Z0-9\s]/g, '').trim();
}

/**
 * Validate username
 */
export function isValidUsername(username, minLength = 2, maxLength = 20) {
    if (!username || typeof username !== 'string') {
        return false;
    }

    const sanitized = sanitizeUsername(username);

    if (sanitized.length < minLength || sanitized.length > maxLength) {
        return false;
    }

    return true;
}

/**
 * Validate message
 */
export function isValidMessage(text, maxLength = 500) {
    if (!text || typeof text !== 'string') {
        return false;
    }

    const trimmed = text.trim();

    if (trimmed.length === 0 || trimmed.length > maxLength) {
        return false;
    }

    return true;
}

/**
 * Check for spam patterns
 */
export function isSpam(text) {
    // Check for repeated characters (more than 10 in a row)
    if (/(.)\1{10,}/.test(text)) {
        return true;
    }

    // Check for excessive caps (more than 70% uppercase)
    const letters = text.replace(/[^a-zA-Z]/g, '');
    if (letters.length > 10) {
        const caps = text.replace(/[^A-Z]/g, '');
        if (caps.length / letters.length > 0.7) {
            return true;
        }
    }

    return false;
}

/**
 * Get moderation result for a message
 */
export function moderateMessage(text) {
    const result = {
        isValid: true,
        reason: null,
        action: null // 'delete', 'warn', 'kick'
    };

    if (!isValidMessage(text)) {
        result.isValid = false;
        result.reason = 'הודעה לא תקינה';
        result.action = 'delete';
        return result;
    }

    if (containsProfanity(text)) {
        result.isValid = false;
        result.reason = 'הודעה מכילה תוכן לא הולם';
        result.action = 'warn';
        return result;
    }

    if (isSpam(text)) {
        result.isValid = false;
        result.reason = 'הודעה מזוהה כספאם';
        result.action = 'delete';
        return result;
    }

    return result;
}
