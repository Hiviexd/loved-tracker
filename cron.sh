#!/bin/bash
# Add paths where pnpm/node live
export PATH=/usr/local/bin:/usr/bin:/bin:/home/hivie/.local/share/pnpm:/home/hivie/.nvm/versions/node/$(node -v)/bin:$PATH

cd /home/hivie/scripts/loved-tracker
$(which pnpm) start >> /home/hivie/scripts/loved-tracker/logs/cronjob.log 2>&1
