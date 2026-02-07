import colors from "colors";

async function timeout(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function timestamp() {
    return new Date().toISOString().replace("T", " ").slice(0, 19);
}

/**
 * @param {string} message - The message to log.
 * @param {{ append: (text: string, options?: object) => Promise<unknown> } | null} [webhook] - The Discord StatefulWebhook to send the message to.
 * @param {{ color?: number } | null} [webhookOptions] - Optional options passed to webhook.append (e.g. color).
 * @param {{ consoleStyle: (msg: string) => string, webhookPrefix: string }} style - Console color style and webhook line prefix.
 */
async function log(message, webhook = null, webhookOptions = null, { consoleStyle, webhookPrefix }) {
    const ts = timestamp();
    console.log(colors.bgWhite.black(`${ts} `) + consoleStyle(` ${message}`));
    if (webhook) {
        await webhook.append(`${webhookPrefix} ${message}`, webhookOptions ?? {});
    }
}

/**
 * @param {string} message - The message to log.
 * @param {Parameters<typeof log>[1]} [webhook]
 * @param {Parameters<typeof log>[2]} [webhookOptions]
 */
async function logInfo(message, webhook = null, webhookOptions = null) {
    return log(message, webhook, webhookOptions, { consoleStyle: colors.bgBlue.black, webhookPrefix: "ℹ️" });
}

/**
 * @param {string} message - The message to log.
 * @param {Parameters<typeof log>[1]} [webhook]
 * @param {Parameters<typeof log>[2]} [webhookOptions]
 */
async function logError(message, webhook = null, webhookOptions = null) {
    return log(message, webhook, webhookOptions, { consoleStyle: colors.bgRed.black, webhookPrefix: "❌" });
}

/**
 * @param {string} message - The message to log.
 * @param {Parameters<typeof log>[1]} [webhook]
 * @param {Parameters<typeof log>[2]} [webhookOptions]
 */
async function logSuccess(message, webhook = null, webhookOptions = null) {
    return log(message, webhook, webhookOptions, { consoleStyle: colors.bgGreen.black, webhookPrefix: "✅" });
}

/**
 * @param {string} message - The message to log.
 * @param {Parameters<typeof log>[1]} [webhook]
 * @param {Parameters<typeof log>[2]} [webhookOptions]
 */
async function logWarning(message, webhook = null, webhookOptions = null) {
    return log(message, webhook, webhookOptions, { consoleStyle: colors.bgYellow.black, webhookPrefix: "⚠️" });
}

export default {
    timeout,
    logInfo,
    logError,
    logSuccess,
    logWarning,
};
