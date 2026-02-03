import { GoogleSpreadsheet } from "google-spreadsheet";
import utils from "./lib/utils.js";
import { sendBadgeWebhook, StatefulWebhook } from "./lib/discord.js";
import config from "./config.json" with { type: "json" };

const API_KEY = config.apiKey;
const SHEET_ID = config.sheetId;
const SHEET_NAME = config.sheetName;
const WEBHOOK_URL = config.webhookUrl;
const DISCORD_PINGS = config.discordPings;

// Stateful webhook for script logs (console + Discord)
const logWebhook = new StatefulWebhook(WEBHOOK_URL, {
    baseEmbed: { color: parseInt("3498db", 16) }, // #3498db
});

async function fetchAndProcessSheet() {
    await utils.consoleLog("Processing Project Loved tenures...", logWebhook);

    const doc = new GoogleSpreadsheet(SHEET_ID, { apiKey: API_KEY });

    await utils.consoleLog("Authenticating with Google Sheets API...", logWebhook);

    await doc.loadInfo().catch(async (error) => {
        await utils.consoleError(`Failed to authenticate with Google Sheets API: ${error}`, logWebhook);
        return null;
    });

    // 15s timeout to give the command cells time to load
    await utils.timeout(15 * 1000);

    const sheet = doc.sheetsByTitle[SHEET_NAME];

    const rows = await sheet.getRows().catch(async (error) => {
        await utils.consoleError(`Failed to get rows from Google Sheets: ${error}`, logWebhook);
        return [];
    });

    await utils.consoleCheck(`Found ${rows.length} rows in sheet`, logWebhook);

    // 10s timeout for extra safety
    await utils.timeout(10 * 1000);

    await utils.consoleLog("Processing Project Loved tenures...", logWebhook);

    let badgeCount = 0;

    const blacklistedRowData = ["loading...", "loading", "...", "null", "n/a", "#name?", "#ref!", "#err!", "#error!"];

    // start from row 4 (index 3); row numbers in sheet are 1-based
    const sheetRowUrlBase = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/edit#gid=${sheet.sheetId}&range=`;
    for (let i = 3; i < rows.length; i++) {
        const row = rows[i];
        const sheetRowNumber = i + 1;
        const sheetRowUrl = `${sheetRowUrlBase}A${sheetRowNumber}`;

        const cell = row._rawData[4].toLowerCase();
        if (!blacklistedRowData.includes(cell)) {
            await sendBadgeWebhook(logWebhook, DISCORD_PINGS, row._rawData, sheetRowUrl);
            badgeCount++;
        } else if (cell !== "...") {
            await utils.consoleWarn(
                `Skipping row ${i} (user: ${row._rawData[1]}) because command cell seems invalid: \`${row._rawData[4]}\``,
                logWebhook
            );
        }
    }

    await utils.consoleCheck(`Processed ${badgeCount} badges!`, logWebhook, {
        color: parseInt("2ecc70", 16), // #2ecc70 when finished
    });
}

await fetchAndProcessSheet().catch(console.error);
