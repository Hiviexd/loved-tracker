import { GoogleSpreadsheet } from "google-spreadsheet";
import axios from "axios";
import config from "./config.json" assert { type: "json" };

const API_KEY = config.apiKey;
const SHEET_ID = config.sheetId;
const SHEET_NAME = config.sheetName;
const WEBHOOK_URL = config.webhookUrl;
const DISCORD_PINGS = config.discordPings;

async function timeout(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function sendWebhook(row) {
    console.log(`Sending webhook for user ${row[1]}`);

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
        console.error("Failed to send webhook: ", error);
    } finally {
        // 1s timeout
        await timeout(1000);
    }
}

async function fetchAndProcessSheet() {
    const doc = new GoogleSpreadsheet(SHEET_ID, { apiKey: API_KEY });

    console.log("Authenticating with Google Sheets API...");

    await doc.loadInfo();

    // 15s timeout to give the command cells time to load
    await timeout(15 * 1000);

    const sheet = doc.sheetsByTitle[SHEET_NAME];

    const rows = await sheet.getRows();

    // 10s timeout for extra safety
    await timeout(10 * 1000);

    console.log("Processing Project Loved tenures...");

    const blacklistedRowData = ["loading...", "loading", "...", "null", "n/a"];

    // start from row 3 (index 2)
    for (let i = 2; i < rows.length; i++) {
        const row = rows[i];

        if (!blacklistedRowData.includes(row._rawData[4].toLowerCase())) {
            await sendWebhook(row._rawData);
        } else {
            console.log(`Skipping row ${i} (user: ${row[1]}) because command cell seems invalid: ${row._rawData[4]}`);
        }
    }

    console.log("Done!");
}

await fetchAndProcessSheet().catch(console.error);
