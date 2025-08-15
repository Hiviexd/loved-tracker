import { GoogleSpreadsheet } from "google-spreadsheet";
import axios from "axios";
import utils from "./lib/utils.js";
import config from "./config.json" assert { type: "json" };

const API_KEY = config.apiKey;
const SHEET_ID = config.sheetId;
const SHEET_NAME = config.sheetName;
const WEBHOOK_URL = config.webhookUrl;
const DISCORD_PINGS = config.discordPings;

async function sendWebhook(row) {
    utils.consoleLog(`Sending webhook for user ${row[1]}`);

    const pingString = DISCORD_PINGS.map((ping) => `<@${ping}>`)
        .join(" ")
        .trim();

    const embed = {
        description: `[**${row[1]}**](https://osu.ppy.sh/users/${row[0]}) needs a tenure badge update! **${row[3]} → ${row[2]}** :tada: \n\`\`\`${row[4]}\`\`\``,
        color: parseInt("ff76c0", 16), // #ff76c0
        image: {
            url: `https://assets.ppy.sh/profile-badges/${row[4].split(" ")[2]}`,
        },
    };

    try {
        await axios.post(WEBHOOK_URL, {
            content: pingString,
            embeds: [embed],
        });
    } catch (error) {
        utils.consoleError(`Failed to send webhook: ${error}`);
    } finally {
        // 1s timeout
        await utils.timeout(1000);
    }
}

async function fetchAndProcessSheet() {
    const doc = new GoogleSpreadsheet(SHEET_ID, { apiKey: API_KEY });

    utils.consoleLog("Authenticating with Google Sheets API...");

    await doc.loadInfo();

    // 15s timeout to give the command cells time to load
    await utils.timeout(15 * 1000);

    const sheet = doc.sheetsByTitle[SHEET_NAME];

    const rows = await sheet.getRows();

    // 10s timeout for extra safety
    await utils.timeout(10 * 1000);

    utils.consoleLog("Processing Project Loved tenures...");

    const blacklistedRowData = ["loading...", "loading", "...", "null", "n/a"];

    let hasProcessed = false;

    // start from row 3 (index 2)
    for (let i = 2; i < rows.length; i++) {
        const row = rows[i];

        if (!blacklistedRowData.includes(row._rawData[4].toLowerCase())) {
            await sendWebhook(row._rawData);
            hasProcessed = true;
        } else {
            utils.consoleWarn(
                `Skipping row ${i} (user: ${row._rawData[1]}) because command cell seems invalid: ${row._rawData[4]}`
            );
        }
    }

    utils.consoleCheck("Done processing badges!");

    // send done webhook if processed
    if (hasProcessed) {
        const doneEmbed = {
            description: "✅ Done processing badges!",
            color: parseInt("2ecc70", 16), // #2ecc70
        };

        // sleep for 3s because fuck me I guess
        await utils.timeout(3 * 1000);

        try {
            await axios.post(WEBHOOK_URL, {
                embeds: [doneEmbed],
            });
        } catch (error) {
            utils.consoleError(`Failed to send done webhook: ${error}`);
        }
    }
}

await fetchAndProcessSheet().catch(console.error);
