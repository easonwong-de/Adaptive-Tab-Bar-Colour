#!/bin/bash
set -e

source "$(dirname "$0")/utils.sh"

cd "$(dirname "$0")/.."
rm -rf .output/*

if [ "$1" == "--clean" ]; then
  echo "Zipping extension without source..."
  run_cmd wxt zip -b firefox --no-sources
  rm -rf .output/atbc
  exit 0
fi

echo "Zipping extension..."
run_cmd wxt zip -b firefox

# Extract version from package.json
VERSION=$(node -p "require('./package.json').version")
SOURCES_ZIP=".output/atbc-${VERSION}-sources.zip"
EXT_ZIP=".output/atbc-${VERSION}.zip"

if [ ! -f "$SOURCES_ZIP" ]; then
  echo "Error: Sources zip not found at $SOURCES_ZIP"
  exit 1
fi

if [ ! -f "$EXT_ZIP" ]; then
  echo "Error: Extension zip not found at $EXT_ZIP"
  exit 1
fi

# Extract both zip file to a temporary directory
TEMP_DIR=$(mktemp -d)
MAIN_EXT_DIR="$TEMP_DIR/main_ext"
SOURCES_DIR="$TEMP_DIR/sources"
mkdir -p "$MAIN_EXT_DIR" "$SOURCES_DIR"
unzip -q "$EXT_ZIP" -d "$MAIN_EXT_DIR"
unzip -q "$SOURCES_ZIP" -d "$SOURCES_DIR"

# Build from the extracted sources
echo "Building from extracted sources..."
(
  cd "$SOURCES_DIR"
  run_cmd npm install --no-audit --no-fund
  run_cmd npm run build
)

# Find the build output directory
SOURCES_BUILD_DIR="$SOURCES_DIR/.output/atbc"
if [ ! -d "$SOURCES_BUILD_DIR" ]; then
  echo "Error: Could not find build output at $SOURCES_BUILD_DIR"
  rm -rf "$TEMP_DIR"
  exit 1
fi

# Compare the built extension with the extracted extension zip
echo "Comparing build outputs..."
set +e
DIFF_OUTPUT=$(diff -ur "$MAIN_EXT_DIR" "$SOURCES_BUILD_DIR")
DIFF_EXIT_CODE=$?
set -e

if [ $DIFF_EXIT_CODE -ne 0 ]; then
  echo "Error: Build output from sources does not match the main project!"
  echo "$DIFF_OUTPUT"
  rm -rf "$TEMP_DIR"
  exit 1
else
  echo "Success: Build outputs match exactly."
  rm -rf "$TEMP_DIR"
  exit 0
fi
