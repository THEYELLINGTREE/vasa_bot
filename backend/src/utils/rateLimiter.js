import logger from './logger.js';

class DiscordRateLimiter {
    constructor() {
        this.retryQueue = new Map();
        this.globalRateLimit = false;
        this.globalResetTime = null;
    }

    /**
     * Execute a Discord API call with automatic retry on rate limits
     * @param {Function} apiCall - The API call function to execute
     * @param {Object} context - Context for logging (userId, guildId, etc.)
     * @param {number} maxRetries - Maximum number of retries
     * @returns {Promise} - Result of the API call
     */
    async executeWithRetry(apiCall, context = {}, maxRetries = 3) {
        let attempt = 0;
        
        while (attempt <= maxRetries) {
            try {
                // Check for global rate limit
                if (this.globalRateLimit && this.globalResetTime && Date.now() < this.globalResetTime) {
                    const waitTime = this.globalResetTime - Date.now();
                    logger.warn('Global rate limit active, waiting', {
                        ...context,
                        waitTime,
                        action: 'discord_global_rate_limit_wait'
                    });
                    await this.sleep(waitTime);
                }

                const result = await apiCall();
                
                // Reset attempt counter on success
                if (attempt > 0) {
                    logger.info('Discord API call succeeded after retry', {
                        ...context,
                        attempts: attempt + 1,
                        action: 'discord_retry_success'
                    });
                }
                
                return result;
                
            } catch (error) {
                attempt++;
                
                // Check if it's a rate limit error
                if (this.isRateLimitError(error)) {
                    const retryAfter = this.extractRetryAfter(error);
                    const isGlobal = this.isGlobalRateLimit(error);
                    
                    if (isGlobal) {
                        this.globalRateLimit = true;
                        this.globalResetTime = Date.now() + (retryAfter * 1000);
                    }
                    
                    if (attempt <= maxRetries) {
                        const waitTime = retryAfter * 1000 + (attempt * 1000); // Add backoff
                        
                        logger.warn('Discord rate limit hit, retrying', {
                            ...context,
                            attempt,
                            maxRetries,
                            waitTime,
                            retryAfter,
                            isGlobal,
                            action: 'discord_rate_limit_retry'
                        });
                        
                        await this.sleep(waitTime);
                        continue;
                    } else {
                        logger.error('Discord rate limit exceeded max retries', {
                            ...context,
                            maxRetries,
                            retryAfter,
                            isGlobal,
                            error: error.message,
                            action: 'discord_rate_limit_failed'
                        });
                    }
                } else {
                    // Non-rate-limit error, log and potentially retry
                    if (this.isRetryableError(error) && attempt <= maxRetries) {
                        const waitTime = Math.pow(2, attempt) * 1000; // Exponential backoff
                        
                        logger.warn('Retryable Discord error, waiting', {
                            ...context,
                            attempt,
                            maxRetries,
                            waitTime,
                            error: error.message,
                            action: 'discord_retryable_error'
                        });
                        
                        await this.sleep(waitTime);
                        continue;
                    } else {
                        logger.error('Discord API error (non-retryable or max retries exceeded)', {
                            ...context,
                            attempt,
                            error: error.message,
                            stack: error.stack,
                            action: 'discord_api_error'
                        });
                    }
                }
                
                throw error;
            }
        }
    }

    /**
     * Check if error is a rate limit error
     */
    isRateLimitError(error) {
        return error.code === 429 || 
               (error.status === 429) ||
               (error.message && error.message.includes('rate limit'));
    }

    /**
     * Check if error is a global rate limit
     */
    isGlobalRateLimit(error) {
        return error.global === true ||
               (error.message && error.message.includes('global'));
    }

    /**
     * Extract retry-after value from error
     */
    extractRetryAfter(error) {
        // Try different ways to get retry-after
        if (error.retry_after) return error.retry_after;
        if (error.retryAfter) return error.retryAfter;
        if (error.headers && error.headers['retry-after']) {
            return parseInt(error.headers['retry-after']);
        }
        if (error.response && error.response.headers && error.response.headers['retry-after']) {
            return parseInt(error.response.headers['retry-after']);
        }
        
        // Default fallback
        return 1;
    }

    /**
     * Check if error is retryable (network issues, 5xx errors, etc.)
     */
    isRetryableError(error) {
        if (error.code === 'ECONNRESET' || error.code === 'ENOTFOUND' || error.code === 'ETIMEDOUT') {
            return true;
        }
        
        if (error.status >= 500 && error.status < 600) {
            return true;
        }
        
        // Discord.js specific retryable errors
        if (error.code === 50013 || error.code === 50001) { // Missing permissions, access
            return false; // Don't retry permission errors
        }
        
        return false;
    }

    /**
     * Sleep utility
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Wrapper for interaction replies with rate limit handling
     */
    async safeReply(interaction, options, context = {}) {
        return this.executeWithRetry(
            async () => {
                if (interaction.replied || interaction.deferred) {
                    return await interaction.followUp(options);
                } else {
                    return await interaction.reply(options);
                }
            },
            {
                ...context,
                userId: interaction.user?.id,
                guildId: interaction.guild?.id,
                action: 'discord_interaction_reply'
            }
        );
    }

    /**
     * Wrapper for interaction edits with rate limit handling
     */
    async safeEditReply(interaction, options, context = {}) {
        return this.executeWithRetry(
            async () => await interaction.editReply(options),
            {
                ...context,
                userId: interaction.user?.id,
                guildId: interaction.guild?.id,
                action: 'discord_interaction_edit'
            }
        );
    }

    /**
     * Wrapper for sending messages with rate limit handling
     */
    async safeSend(channel, options, context = {}) {
        return this.executeWithRetry(
            async () => await channel.send(options),
            {
                ...context,
                channelId: channel.id,
                guildId: channel.guild?.id,
                action: 'discord_channel_send'
            }
        );
    }
}

export default new DiscordRateLimiter();