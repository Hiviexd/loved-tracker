#!/bin/bash

USER_HOME=$HOME

export PATH="$USER_HOME/.local/share/pnpm:/usr/local/bin:/usr/bin:/bin:$PATH"

cd "$USER_HOME/scripts/loved-tracker" || exit

echo "--- Job started at $(date) ---" >> "$USER_HOME/scripts/loved-tracker/logs/cronjob.log"

pnpm start >> "$USER_HOME/scripts/loved-tracker/logs/cronjob.log" 2>&1
