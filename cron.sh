#!/bin/bash

USER_HOME=$HOME
CURRENT_USER=$(whoami)

export PATH=/usr/local/bin:/usr/bin:/bin:$USER_HOME/.local/share/pnpm:$USER_HOME/.nvm/versions/node/$(node -v 2>/dev/null)/bin:$PATH

cd "$USER_HOME/scripts/loved-tracker"

$(command -v pnpm) start >> "$USER_HOME/scripts/loved-tracker/logs/cronjob.log" 2>&1
