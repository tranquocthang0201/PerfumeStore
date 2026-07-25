#!/bin/sh
set -eu

npm run db:init
exec npm start
