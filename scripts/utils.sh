#!/bin/bash

# Run a command and output its logs only on error
run_cmd() {
	local output
	if ! output=$("$@" 2>&1); then
		echo "$output"
		return 1
	fi
}
