#!/bin/bash
# Usage: ./upload_test.sh /path/to/file.jpg
if [ -z "$1" ]; then
  echo "Usage: $0 /path/to/file"
  exit 1
fi

API_URL="https://signal-moi-api.onrender.com/api/test/upload"
FILEPATH="$1"

curl -v -X POST "$API_URL" \
  -H "Accept: application/json" \
  -F "file=@${FILEPATH}"

echo
