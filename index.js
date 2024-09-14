import { GoogleSpreadsheet } from "google-spreadsheet";
import axios from "axios";
import config from "./config.json" assert { type: "json" };

const API_KEY = config.apiKey;
const SHEET_ID = config.sheetId;
const SHEET_NAME = config.sheetName;
const WEBHOOK_URL = config.webhookUrl;
const DISCORD_PINGS = config.discordPings;

async function sendWebhook(row) {
    console.log(`Sending webhook for user ${row[1]}`);

    const pingString = DISCORD_PINGS.map((ping) => `<@${ping}>`).join(" ").trim();

    const embed = {
        description: `[**${row[1]}**](https://osu.ppy.sh/users/${row[0]}) needs a tenure badge update! :tada: \n\`\`\`${row[4]}\`\`\``,
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
        await new Promise((resolve) => setTimeout(resolve, 1000));
    }
}

async function fetchAndProcessSheet() {
    const doc = new GoogleSpreadsheet(SHEET_ID, { apiKey: API_KEY });

    await doc.loadInfo();
    const sheet = doc.sheetsByTitle[SHEET_NAME];

    const rows = await sheet.getRows();

    console.log("Processing Project Loved tenures...");

    // start from row 3 (index 2)
    for (let i = 2; i < rows.length; i++) {
        const row = rows[i];

        if (row._rawData[4] !== "...") {
            await sendWebhook(row._rawData);
        }
    }

    console.log("Done!");
}

await fetchAndProcessSheet().catch(console.error);
