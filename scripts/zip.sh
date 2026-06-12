#!/bin/bash

set -e
source "$(dirname "$0")/utils.sh"
VERSION=$(get_version)

cd "$(dirname "$0")/.."
rm -rf .output/*

if [ "$1" == "--clean" ]; then
	echo "Zipping extension without source..."
	run_cmd wxt zip -b firefox --no-sources
	rm -rf .output/atbc
	print_success "Success: Extension zip is ready."
	exit 0
elif [ "$1" == "--beta" ]; then
	echo "Zipping beta extension..."
	run_cmd wxt zip -b firefox --no-sources --mode beta
	rm -rf .output/atbc
	print_success "Success: Beta extension build is ready."
	exit 0
elif [ -z "$1" ]; then
	echo "Zipping extension..."
	run_cmd wxt zip -b firefox
	rm -rf .output/atbc

	SOURCES_ZIP=".output/atbc-${VERSION}-sources.zip"
	EXT_ZIP=".output/atbc-${VERSION}.zip"

	if [ ! -f "$SOURCES_ZIP" ]; then
		print_error "Error: Sources zip not found at $SOURCES_ZIP"
	fi

	if [ ! -f "$EXT_ZIP" ]; then
		print_error "Error: Extension zip not found at $EXT_ZIP"
	fi

	echo "Comparing build output to extension zip..."

	TEMP_DIR=$(mktemp -d)
	MAIN_EXT="$TEMP_DIR/main_ext"
	SOURCES_DIR="$TEMP_DIR/sources"
	mkdir -p "$MAIN_EXT" "$SOURCES_DIR"
	unzip -q "$EXT_ZIP" -d "$MAIN_EXT"
	unzip -q "$SOURCES_ZIP" -d "$SOURCES_DIR"

	(
		cd "$SOURCES_DIR"
		run_cmd npm install --no-audit --no-fund
		run_cmd npm run build
	)

	SOURCES_BUILD_DIR="$SOURCES_DIR/.output/atbc"
	[ ! -d "$SOURCES_BUILD_DIR" ] && {
		rm -rf "$TEMP_DIR"
		print_error "Error: No build output at $SOURCES_BUILD_DIR"
	}

	set +e
	DIFF_OUTPUT=$(diff -ur "$MAIN_EXT" "$SOURCES_BUILD_DIR")
	DIFF_EXIT_CODE=$?
	set -e
	rm -rf "$TEMP_DIR"

	if [ "$DIFF_EXIT_CODE" -ne 0 ]; then
		echo "$DIFF_OUTPUT"
		print_error "Error: Build output does not match the extension zip."
	else
		print_success "Success: Extension and source code zips are ready."
		exit 0
	fi
else
	print_error "Error: Unsupported flag '$1'."
fi
