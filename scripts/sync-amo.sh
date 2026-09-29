#!/bin/bash

set -euo pipefail
source "$(dirname "$0")/utils.sh"
cd "$(dirname "$0")/.."

# Build JSON object containing all localised AMO descriptions
build_amo_descriptions() {
	local files=("$@")
	for file in "${files[@]}"; do
		local locale content
		locale=$(get_locale_from_readme "$file")
		content=$(convert_markdown_to_amo "$file")
		jq -n --arg loc "$locale" --arg content "$content" '{($loc): $content}'
	done | jq -s 'add'
}

# Write AMO synchronisation results table to GitHub Actions step summary
write_step_summary() {
	local -a files=("${!1}")
	local -a skipped=("${!2}")

	{
		echo "### AMO Descriptions Synchronisation"
		echo ""
		echo "| Locale | Status | AMO Page |"
		echo "| :--- | :--- | :--- |"
		for file in "${files[@]}"; do
			local loc status="Synchronised"
			loc=$(get_locale_from_readme "$file")
			if [[ " ${skipped[*]:-} " =~ [[:space:]]"${loc}"[[:space:]] ]]; then
				status="Skipped (unsupported)"
			fi
			echo "| \`${loc}\` | ${status} | [View](https://addons.mozilla.org/${loc}/firefox/addon/adaptive-tab-bar-colour/) |"
		done
	} >>"$GITHUB_STEP_SUMMARY"
}

# Synchronise localised descriptions with Mozilla Add-ons API
sync_amo_descriptions() {
	shopt -s nullglob
	local files=(.github/README.md .github/README.*.md)
	[ ${#files[@]} -eq 0 ] && print_error "Error: No .github/README*.md files found."

	local token description skipped_locales=() response_file
	token=$(generate_amo_jwt)
	description=$(build_amo_descriptions "${files[@]}")
	response_file=$(mktemp)
	trap 'rm -f "$response_file"' EXIT

	while true; do
		local body http_code
		body=$(jq -n --argjson desc "$description" '{"description": $desc}')
		http_code=$(
			curl -s -o "$response_file" -w "%{http_code}" -X PATCH \
				"https://addons.mozilla.org/api/v5/addons/addon/adaptive-tab-bar-colour/" \
				-H "Authorization: JWT ${token}" \
				-H "Content-Type: application/json" \
				-d "$body"
		)

		[ "$http_code" -ge 200 ] && [ "$http_code" -lt 300 ] && break

		local invalid_locales
		invalid_locales=$(
			jq -r '.. | strings' "$response_file" 2>/dev/null |
				sed -n -E 's/.*The language code "([^"]+)".*/\1/p'
		)

		if [ -z "$invalid_locales" ]; then
			cat "$response_file" >&2
			print_error "Error: Failed to synchronise AMO descriptions (HTTP ${http_code})."
		fi

		for loc in $invalid_locales; do
			skipped_locales+=("$loc")
			description=$(jq --arg loc "$loc" 'del(.[$loc])' <<<"$description")
		done

		[ "$(jq 'keys | length' <<<"$description")" -eq 0 ] &&
			print_error "Error: No valid locales remaining to synchronise."
	done

	if [ -n "${GITHUB_STEP_SUMMARY:-}" ]; then
		write_step_summary files[@] skipped_locales[@]
	fi

	print_success "Success: AMO descriptions synchronised."
}

if [ "${BASH_SOURCE[0]}" = "$0" ]; then
	sync_amo_descriptions
fi
