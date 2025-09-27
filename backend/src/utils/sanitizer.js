import logger from './logger.js';

class Sanitizer {
    /**
     * Remove potentially dangerous HTML/script content
     */
    sanitizeHtml(input) {
        if (!input || typeof input !== 'string') return input;
        
        // Remove script tags and their content
        let sanitized = input.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
        
        // Remove potentially dangerous HTML tags
        const dangerousTags = [
            'script', 'iframe', 'object', 'embed', 'form', 'input', 
            'button', 'select', 'textarea', 'link', 'meta', 'style'
        ];
        
        dangerousTags.forEach(tag => {
            const regex = new RegExp(`<${tag}\\b[^>]*>.*?<\\/${tag}>`, 'gi');
            sanitized = sanitized.replace(regex, '');
            // Also remove self-closing tags
            const selfClosingRegex = new RegExp(`<${tag}\\b[^>]*\\/>`, 'gi');
            sanitized = sanitized.replace(selfClosingRegex, '');
        });
        
        // Remove javascript: and data: URLs
        sanitized = sanitized.replace(/javascript:/gi, '');
        sanitized = sanitized.replace(/data:/gi, '');
        
        // Remove on* event handlers
        sanitized = sanitized.replace(/\son\w+\s*=\s*["'][^"']*["']/gi, '');
        
        return sanitized.trim();
    }

    /**
     * Sanitize event title (more restrictive)
     */
    sanitizeEventTitle(title) {
        if (!title || typeof title !== 'string') return '';
        
        // Remove HTML entirely
        let sanitized = title.replace(/<[^>]*>/g, '');
        
        // Limit length
        sanitized = sanitized.substring(0, 100);
        
        // Remove excessive whitespace
        sanitized = sanitized.replace(/\s+/g, ' ').trim();
        
        return sanitized;
    }

    /**
     * Sanitize event description (allow basic formatting)
     */
    sanitizeEventDescription(description) {
        if (!description || typeof description !== 'string') return '';
        
        // Allow basic formatting but remove dangerous content
        let sanitized = this.sanitizeHtml(description);
        
        // Limit length
        sanitized = sanitized.substring(0, 1000);
        
        // Clean up excessive whitespace/newlines
        sanitized = sanitized.replace(/\n{3,}/g, '\n\n').trim();
        
        return sanitized;
    }

    /**
     * Sanitize location field
     */
    sanitizeLocation(location) {
        if (!location || typeof location !== 'string') return '';
        
        // Remove HTML entirely for location
        let sanitized = location.replace(/<[^>]*>/g, '');
        
        // Limit length
        sanitized = sanitized.substring(0, 200);
        
        // Remove excessive whitespace
        sanitized = sanitized.replace(/\s+/g, ' ').trim();
        
        return sanitized;
    }

    /**
     * Validate and sanitize date input
     */
    validateDate(dateInput) {
        if (!dateInput) {
            throw new Error('Date is required');
        }
        
        const date = new Date(dateInput);
        if (isNaN(date.getTime())) {
            throw new Error('Invalid date format');
        }
        
        if (date <= new Date()) {
            throw new Error('Event date must be in the future');
        }
        
        // Don't allow events more than 2 years in the future
        const twoYearsFromNow = new Date();
        twoYearsFromNow.setFullYear(twoYearsFromNow.getFullYear() + 2);
        if (date > twoYearsFromNow) {
            throw new Error('Event date cannot be more than 2 years in the future');
        }
        
        return date;
    }

    /**
     * Comprehensive event data sanitization
     */
    sanitizeEventData(eventData, context = {}) {
        try {
            const sanitized = {
                title: this.sanitizeEventTitle(eventData.title),
                description: this.sanitizeEventDescription(eventData.description),
                location: this.sanitizeLocation(eventData.location),
                date_time: this.validateDate(eventData.date_time || eventData.dateTime)
            };

            // Log if any sanitization occurred
            const changed = [];
            if (sanitized.title !== eventData.title) changed.push('title');
            if (sanitized.description !== eventData.description) changed.push('description');
            if (sanitized.location !== eventData.location) changed.push('location');

            if (changed.length > 0) {
                logger.warn('Input sanitization applied', {
                    ...context,
                    sanitizedFields: changed,
                    originalTitle: eventData.title,
                    action: 'input_sanitization'
                });
            }

            return sanitized;
        } catch (error) {
            logger.error('Event data sanitization failed', {
                ...context,
                error: error.message,
                action: 'sanitization_error'
            });
            throw error;
        }
    }

    /**
     * SQL injection protection - validate integers
     */
    validateInteger(value, fieldName = 'value') {
        const parsed = parseInt(value);
        if (isNaN(parsed)) {
            throw new Error(`${fieldName} must be a valid integer`);
        }
        return parsed;
    }

    /**
     * Validate Discord IDs (snowflakes)
     */
    validateDiscordId(id, fieldName = 'ID') {
        if (!id || typeof id !== 'string') {
            throw new Error(`${fieldName} is required`);
        }
        
        // Discord snowflakes are 17-19 digit strings
        if (!/^\d{17,19}$/.test(id)) {
            throw new Error(`${fieldName} must be a valid Discord ID`);
        }
        
        return id;
    }
}

export default new Sanitizer();