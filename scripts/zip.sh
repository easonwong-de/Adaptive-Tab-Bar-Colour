#!/bin/bash

set -e
source "$(dirname "$0")/utils.sh"

cd "$(dirname "$0")/.."
rm -rf .output/*

if [ "$1" == "--clean" ]; then
	echo "Zipping extension without source..."
	run_cmd wxt zip -b firefox --no-sources
	rm -rf .output/atbc
	print_success "Success: Extension zip is ready."
	exit 0
elif [ "$1" == "--beta" ]; then
	echo "Building beta extension..."
	run_cmd wxt build -b firefox --mode beta
	print_success "Success: Beta extension build is ready."
	exit 0
elif [ -z "$1" ]; then
	echo "Zipping extension..."
	run_cmd wxt zip -b firefox

	BUILD_DIR=".output/atbc"
	SOURCES_ZIP=".output/atbc-sources.zip"
	if [ ! -d "$BUILD_DIR" ]; then
		print_error "Error: Extension build not found at $BUILD_DIR"
	fi
	if [ ! -f "$SOURCES_ZIP" ]; then
		print_error "Error: Sources zip not found at $SOURCES_ZIP"
	fi

	echo "Validating sources zip..."

	SOURCES_DIR=$(mktemp -d)
	mkdir -p "$SOURCES_DIR"
	unzip -q "$SOURCES_ZIP" -d "$SOURCES_DIR"

	(
		cd "$SOURCES_DIR"
		run_cmd npm install --no-audit --no-fund
		run_cmd wxt build -b firefox
	)

	SOURCES_BUILD_DIR="$SOURCES_DIR/.output/atbc"
	[ ! -d "$SOURCES_BUILD_DIR" ] && {
		rm -rf "$SOURCES_DIR"
		print_error "Error: No build output from sources at $SOURCES_BUILD_DIR"
	}

	set +e
	DIFF_OUTPUT=$(diff -ur "$BUILD_DIR" "$SOURCES_BUILD_DIR")
	DIFF_EXIT_CODE=$?
	set -e
	rm -rf "$SOURCES_DIR"

	if [ "$DIFF_EXIT_CODE" -ne 0 ]; then
		echo "$DIFF_OUTPUT"
		print_error "Error: Build output from sources does not match the extension build."
	else
		print_success "Success: Extension build and sources zip are ready."
		exit 0
	fi
else
	print_error "Error: Unsupported flag '$1'."
fi
