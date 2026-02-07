import axios from "axios";
import utils from "./utils.js";

/**
 * Sends a badge webhook notification for a user who needs a tenure badge update.
 * @param {object} options - Options for the badge webhook
 * @param {StatefulWebhook} options.logWebhook - Stateful webhook for logging
 * @param {string} options.pingWebhookUrl - Webhook URL to send the badge ping to
 * @param {string[]} options.discordPings - Array of Discord user IDs to ping
 * @param {string[]} options.row - Row data [userId, username, newBadge, oldBadge, command]
 * @param {string} [options.sheetRowUrl] - Optional link to the sheet row for this user
 */
async function sendBadgeWebhook({ logWebhook, pingWebhookUrl, discordPings, row, sheetRowUrl }) {
    utils.consoleLog(`Sending webhook for user ${row[1]}`, logWebhook);

    const pingString = discordPings
        .map((ping) => `<@${ping}>`)
        .join(" ")
        .trim();

    let description = `[**${row[1]}**](https://osu.ppy.sh/users/${row[0]}) needs a tenure badge update! **${row[3]} → ${row[2]}** :tada: \n\`\`\`${row[4]}\`\`\``;
    if (sheetRowUrl) {
        description += `\n[📋 View sheet row](${sheetRowUrl})`;
    }

    const embed = {
        description,
        color: parseInt("ff76c0", 16), // #ff76c0
        image: {
            url: `https://assets.ppy.sh/profile-badges/${row[4].split(" ")[2]}`,
        },
    };

    try {
        await axios.post(pingWebhookUrl, {
            content: pingString,
            embeds: [embed],
        });
    } catch (error) {
        utils.consoleError(`Failed to send webhook: ${error}`, logWebhook);
    } finally {
        // 1s timeout
        await utils.timeout(1000);
    }
}

// Discord API limits
const EMBED_DESCRIPTION_LIMIT = 4096;
const EMBEDS_PER_MESSAGE_LIMIT = 10;
const APPEND_RATE_LIMIT_MS = 500;

/**
 * A stateful Discord webhook that can send an initial message and then
 * update it with subsequent calls instead of sending new messages.
 * Automatically handles Discord's embed limits when appending content.
 */
class StatefulWebhook {
    #messageId = null;
    #embeds = [];
    #content = null;
    #baseEmbed = {};

    /**
     * @param {string} webhookUrl - The Discord webhook URL
     * @param {object} [options] - Configuration options
     * @param {object} [options.baseEmbed] - Base embed properties (color, footer, etc.) applied to all embeds
     */
    constructor(webhookUrl, options = {}) {
        this.webhookUrl = webhookUrl;
        this.#baseEmbed = options.baseEmbed || {};
    }

    /**
     * Sends an initial message or updates the existing one.
     * On first call, sends a new message and stores its ID.
     * On subsequent calls, edits the existing message.
     * @param {object} payload - The webhook payload (content, embeds, etc.)
     * @returns {Promise<object|null>} The message object on success, null on failure
     */
    async send(payload) {
        if (this.#messageId) {
            return this.#update(payload);
        }

        try {
            // Add ?wait=true to get the message object back with its ID
            const response = await axios.post(`${this.webhookUrl}?wait=true`, payload);
            this.#messageId = response.data.id;

            // Track embeds from the payload
            if (payload.embeds) {
                this.#embeds = [...payload.embeds];
            }
            if (payload.content !== undefined) {
                this.#content = payload.content;
            }

            await utils.timeout(APPEND_RATE_LIMIT_MS);
            return response.data;
        } catch (error) {
            utils.consoleError(`Failed to send initial webhook message: ${error}`);
            return null;
        }
    }

    /**
     * Updates the existing webhook message.
     * @param {object} payload - The webhook payload (content, embeds, etc.)
     * @returns {Promise<object|null>} The updated message object on success, null on failure
     */
    async #update(payload) {
        if (!this.#messageId) {
            utils.consoleError("Cannot update: no message has been sent yet. Use send() first.");
            return null;
        }

        try {
            const response = await axios.patch(`${this.webhookUrl}/messages/${this.#messageId}`, payload);

            // Update tracked state
            if (payload.embeds) {
                this.#embeds = [...payload.embeds];
            }
            if (payload.content !== undefined) {
                this.#content = payload.content;
            }

            await utils.timeout(APPEND_RATE_LIMIT_MS);
            return response.data;
        } catch (error) {
            utils.consoleError(`Failed to update webhook message: ${error}`);
            return null;
        }
    }

    /**
     * Appends text to the current embed's description.
     * Automatically handles Discord's limits:
     * - If description exceeds 4096 chars, creates a new embed
     * - If embeds exceed 10, creates a new message
     * @param {string} text - The text to append
     * @param {string | { separator?: string, color?: number }} [options] - Separator (string) or options object with separator and/or color
     * @returns {Promise<object|null>} The message object on success, null on failure
     */
    async append(text, options = {}) {
        const separator = typeof options === "string" ? options : options.separator ?? "\n";
        const color = typeof options === "object" && options !== null && "color" in options ? options.color : undefined;

        // If no message exists yet, create one with the text
        if (!this.#messageId) {
            const embed = { ...this.#baseEmbed, description: text };
            if (color !== undefined) embed.color = color;
            this.#embeds = [embed];
            return this.send({ content: this.#content, embeds: this.#embeds });
        }

        // Get the current embed or create one if none exist
        if (this.#embeds.length === 0) {
            this.#embeds.push({ ...this.#baseEmbed, description: "" });
        }

        const currentEmbed = this.#embeds[this.#embeds.length - 1];
        const currentDescription = currentEmbed.description || "";
        const newDescription = currentDescription ? `${currentDescription}${separator}${text}` : text;

        // Apply color to current embed if provided
        if (color !== undefined) currentEmbed.color = color;

        // Check if we need a new embed due to description length
        if (newDescription.length > EMBED_DESCRIPTION_LIMIT) {
            // Check if we can add another embed to this message
            if (this.#embeds.length < EMBEDS_PER_MESSAGE_LIMIT) {
                // Add a new embed
                const newEmbed = { ...this.#baseEmbed, description: text };
                if (color !== undefined) newEmbed.color = color;
                this.#embeds.push(newEmbed);
                return this.#update({ content: this.#content, embeds: this.#embeds });
            } else {
                // We've hit the embed limit, need a new message
                this.#messageId = null;
                const newEmbed = { ...this.#baseEmbed, description: text };
                if (color !== undefined) newEmbed.color = color;
                this.#embeds = [newEmbed];
                return this.send({ content: this.#content, embeds: this.#embeds });
            }
        }

        // Update the current embed's description
        currentEmbed.description = newDescription;
        return this.#update({ content: this.#content, embeds: this.#embeds });
    }

    /**
     * Appends an entire embed to the message.
     * If the message already has 10 embeds, creates a new message.
     * @param {object} embed - The embed object to append
     * @returns {Promise<object|null>} The message object on success, null on failure
     */
    async appendEmbed(embed) {
        const embedWithBase = { ...this.#baseEmbed, ...embed };

        // If no message exists yet, create one
        if (!this.#messageId) {
            this.#embeds = [embedWithBase];
            return this.send({ content: this.#content, embeds: this.#embeds });
        }

        // Check if we can add another embed
        if (this.#embeds.length < EMBEDS_PER_MESSAGE_LIMIT) {
            this.#embeds.push(embedWithBase);
            return this.#update({ content: this.#content, embeds: this.#embeds });
        } else {
            // Need a new message
            this.#messageId = null;
            this.#embeds = [embedWithBase];
            return this.send({ content: this.#content, embeds: this.#embeds });
        }
    }

    /**
     * Sets the content (text outside embeds) for the message.
     * @param {string|null} content - The content to set
     * @returns {Promise<object|null>} The message object on success, null on failure
     */
    async setContent(content) {
        this.#content = content;

        if (this.#messageId) {
            return this.#update({ content: this.#content, embeds: this.#embeds });
        }

        return null;
    }

    /**
     * Forces a new message to be sent, even if one already exists.
     * The new message becomes the "current" message for future updates.
     * @param {object} payload - The webhook payload (content, embeds, etc.)
     * @returns {Promise<object|null>} The message object on success, null on failure
     */
    async sendNew(payload) {
        this.#messageId = null;
        this.#embeds = [];
        this.#content = null;
        return this.send(payload);
    }

    /**
     * Resets the state, clearing the stored message ID and embeds.
     * The next call to send() will create a new message.
     */
    reset() {
        this.#messageId = null;
        this.#embeds = [];
        this.#content = null;
    }

    /**
     * Gets the current message ID, if any.
     * @returns {string|null}
     */
    getMessageId() {
        return this.#messageId;
    }

    /**
     * Gets the current number of embeds in the message.
     * @returns {number}
     */
    getEmbedCount() {
        return this.#embeds.length;
    }

    /**
     * Gets the current description length of the last embed.
     * @returns {number}
     */
    getCurrentDescriptionLength() {
        if (this.#embeds.length === 0) return 0;
        return this.#embeds[this.#embeds.length - 1].description?.length || 0;
    }
}

export { sendBadgeWebhook, StatefulWebhook };
export default { sendBadgeWebhook, StatefulWebhook };
