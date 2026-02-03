import colors from "colors";

async function timeout(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * @param {string} message - The message to log.
 * @param {{ append: (text: string, options?: object) => Promise<unknown> } | null} [webhook] - The Discord StatefulWebhook to send the message to.
 * @param {{ color?: number } | null} [webhookOptions] - Optional options passed to webhook.append (e.g. color).
 */
async function consoleLog(message, webhook = null, webhookOptions = null) {
    console.log(colors.bgBlue.black(message));
    if (webhook) {
        await webhook.append(`ℹ️ ${message}`, webhookOptions ?? {});
    }
}

/**
 * @param {string} message - The message to log.
 * @param {{ append: (text: string, options?: object) => Promise<unknown> } | null} [webhook] - The Discord StatefulWebhook to send the message to.
 * @param {{ color?: number } | null} [webhookOptions] - Optional options passed to webhook.append (e.g. color).
 */
async function consoleError(message, webhook = null, webhookOptions = null) {
    console.log(colors.bgRed.black(message));
    if (webhook) {
        await webhook.append(`❌ ${message}`, webhookOptions ?? {});
    }
}

/**
 * @param {string} message - The message to log.
 * @param {{ append: (text: string, options?: object) => Promise<unknown> } | null} [webhook] - The Discord StatefulWebhook to send the message to.
 * @param {{ color?: number } | null} [webhookOptions] - Optional options passed to webhook.append (e.g. color).
 */
async function consoleCheck(message, webhook = null, webhookOptions = null) {
    console.log(colors.bgGreen.black(message));
    if (webhook) {
        await webhook.append(`✅ ${message}`, webhookOptions ?? {});
    }
}

/**
 * @param {string} message - The message to log.
 * @param {{ append: (text: string, options?: object) => Promise<unknown> } | null} [webhook] - The Discord StatefulWebhook to send the message to.
 * @param {{ color?: number } | null} [webhookOptions] - Optional options passed to webhook.append (e.g. color).
 */
async function consoleWarn(message, webhook = null, webhookOptions = null) {
    console.log(colors.bgYellow.black(message));
    if (webhook) {
        await webhook.append(`⚠️ ${message}`, webhookOptions ?? {});
    }
}

export default {
    timeout,
    consoleLog,
    consoleError,
    consoleCheck,
    consoleWarn,
};
