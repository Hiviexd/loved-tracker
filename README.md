# loved-tracker

a simple script that checks the [Project Loved tracksheet](https://docs.google.com/spreadsheets/d/117NbjqU9tBmJlv5iO3KuCJ9nVWmpcV-r94BziYX5TN0/edit?gid=2090615747#gid=2090615747) and notifies for needed badge updates via a Discord webhook.

this script is intended to be run as a cronjob.

## setup

1. have node.js
2. clone the repo
3. `yarn`
4. create a `config.json` based on `config.example.json`:
   - `apiKey`: your google sheets api key
   - `sheetId`: the id of the spreadsheet you want to track
   - `sheetName`: the name of the sheet you want to track
   - `webhookUrl`: the url of the discord webhook you want to send notifications through
   - `discordPings`: a string array of discord user ids to ping when a notification is sent
5. `yarn start`
