#!/bin/bash

# Run a command and output its logs only on error
run_cmd() {
	local output
	if ! output=$("$@" 2>&1); then
		echo "$output"
		return 1
	fi
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

# Get current version from package.json
get_package_version() {
	node -p "require('./package.json').version"
}

# Execute integration tests
execute_integration_tests() {
	npm ci --silent
	npm rebuild --silent
	node --run zip:clean
	node --run test:headless
}

# Configure git user identity for GitHub Actions bot
setup_git_author() {
	git config user.name "github-actions[bot]"
	git config user.email "github-actions[bot]@users.noreply.github.com"
}

# Tag repository with specified tag name and push to origin
git_tag_and_push() {
	local tag="$1"
	git tag "$tag"
	git push origin "$tag"
}

# Validate version string format (X.Y.Z)
validate_version_format() {
	local version="$1"
	if ! [[ "$version" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
		print_error "Error: Expects version format (X.Y.Z)."
	fi
}

# Create bump branch, bump package version, commit and push changes
bump_package_version() {
	local version="$1"
	validate_version_format "$version"
	git checkout -b "bump/v${version}"
	npm version "$version" --no-git-tag-version
	setup_git_author
	git add package.json
	[ -f package-lock.json ] && git add package-lock.json
	git commit -m "bump: bump version to ${version}"
	git push origin "bump/v${version}"
}

# Create and auto-merge pull request for version bump
create_and_merge_pr() {
	local version="$1"
	gh pr create \
		--title "Bump version to ${version}" \
		--body "Automated version bump to ${version}" \
		--head "bump/v${version}" \
		--base main
	gh pr merge "bump/v${version}" \
		--admin \
		--merge \
		--delete-branch
}

# Compute next beta iteration and write outputs to GITHUB_OUTPUT
prepare_beta_version() {
	npm ci --silent
	local base_version
	base_version=$(get_package_version)
	local latest_beta
	latest_beta=$(git tag -l "v${base_version}-beta.*" | sort -V | tail -n 1)
	local iteration=1
	[ -n "$latest_beta" ] && iteration=$((${latest_beta##*.} + 1))
	local amo_version="${base_version}.${iteration}"
	local beta_tag="v${base_version}-beta.${iteration}"
	echo "beta_version=${amo_version}" >>"$GITHUB_OUTPUT"
	echo "beta_tag=${beta_tag}" >>"$GITHUB_OUTPUT"
}

# Build beta extension package and sign with web-ext
build_and_sign_beta() {
	local beta_version="$1"
	node --run zip:beta
	jq --arg ver "$beta_version" '.version = $ver' .output/atbc/manifest.json >tmp.json && mv tmp.json .output/atbc/manifest.json
	npx web-ext sign \
		--api-key "$FIREFOX_JWT_ISSUER" \
		--api-secret "$FIREFOX_JWT_SECRET" \
		--channel unlisted \
		--source-dir .output/atbc \
		--artifacts-dir .output \
		--approval-timeout 200000 ||
		echo "Signing timed out. Proceeding without XPI."
}

# Tag release, locate and rename XPI asset, and create GitHub pre-release
create_beta_release() {
	local beta_tag="$1"
	local beta_version="$2"
	git_tag_and_push "$beta_tag"
	local xpi_asset
	xpi_asset=$(find .output -name "*.xpi" 2>/dev/null | head -n 1 || true)
	local asset_args=()
	if [ -n "$xpi_asset" ]; then
		local renamed_asset=".output/atbc-${beta_version}.xpi"
		mv "$xpi_asset" "$renamed_asset"
		asset_args+=("$renamed_asset")
	fi
	gh release create "$beta_tag" "${asset_args[@]}" --title "$beta_tag" --prerelease
}

# Extract package version and create AMO metadata file
prepare_production_metadata() {
	local notes="$1"
	npm ci --silent
	local base_version
	base_version=$(get_package_version)
	echo "version=${base_version}" >>"$GITHUB_OUTPUT"
	jq -n --arg notes "$notes" '{"version": {"release_notes": {"en-GB": $notes}}}' >amo_metadata.json
}

# Build production extension package and sign with web-ext
build_and_sign_production() {
	node --run zip
	npx web-ext sign \
		--api-key "$FIREFOX_JWT_ISSUER" \
		--api-secret "$FIREFOX_JWT_SECRET" \
		--channel listed \
		--source-dir .output/atbc \
		--upload-source-code .output/atbc-sources.zip \
		--amo-metadata amo_metadata.json \
		--approval-timeout 0
}

# Tag repository and create GitHub production release
create_production_release() {
	local version="$1"
	local notes="$2"
	git_tag_and_push "v${version}"
	gh release create "v${version}" --title "v${version}" --notes "$notes"
}

if [ "${BASH_SOURCE[0]}" = "$0" ]; then
	"$@"
fi
