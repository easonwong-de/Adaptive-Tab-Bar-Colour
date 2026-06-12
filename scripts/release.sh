#!/bin/bash

set -e
source "$(dirname "$0")/utils.sh"
VERSION=$(get_version)

if [ "$1" == "--beta" ]; then
	if [ -f ".env.submit" ]; then
		set -a
		source .env.submit
		set +a
	else
		print_error "Error: .env.submit not found."
	fi

	echo "Signing beta extension..."
	if npx web-ext sign \
		--api-key "$FIREFOX_JWT_ISSUER" \
		--api-secret "$FIREFOX_JWT_SECRET" \
		--channel "unlisted" \
		--source-dir .output/atbc-beta \
		--artifacts-dir .output; then
		mv .output/*.xpi ".output/atbc-${VERSION}-beta.xpi"
		rm -rf .output/atbc web-ext-artifacts
		print_success "Success: Beta release signed successfully."
	else
		print_error "Error: Failed to sign beta extension."
	fi
elif [ "$1" == "--test" ]; then
	if wxt submit \
		--dry-run \
		--firefox-zip .output/atbc-${VERSION}.zip \
		--firefox-sources-zip .output/atbc-${VERSION}-sources.zip; then
		print_success "Success: Release submitted successfully."
	else
		print_error "Error: Failed to submit release."
	fi
elif [ -z "$1" ]; then
	read -p "Confirm release version ${VERSION}? (y/n) " -n 1 -r
	echo
	if [[ ! $REPLY =~ ^[Yy]$ ]]; then
		echo "Release cancelled."
		exit 0
	fi

	if wxt submit \
		--firefox-zip .output/atbc-${VERSION}.zip \
		--firefox-sources-zip .output/atbc-${VERSION}-sources.zip; then
		print_success "Success: Release submitted successfully."
	else
		print_error "Error: Failed to submit release."
	fi
else
	print_error "Error: Unsupported flag '$1'."
fi
