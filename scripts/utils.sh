#!/bin/bash

# Run a command and output its logs only on error
run_cmd() {
	local output
	if ! output=$("$@" 2>&1); then
		echo "$output"
		return 1
	fi
}

# Extract version from package.json
get_version() {
	node -p "require('./package.json').version"
}

# Print success message in green
print_success() {
	echo -e "\033[32m$1\033[0m"
}

# Print error message in red and exit 1
print_error() {
	echo -e "\033[31m$1\033[0m" >&2
	exit 1
}
