# Source Code Review

This document contains instructions for Mozilla reviewers to build the Adaptive Tab Bar Colour extension from source.

## Prerequisites

- Node.js (v20 or higher)
- npm

## Build Steps

1. Extract the source code zip file.
2. Open a terminal and navigate to the extracted directory.
3. Run the following command to install dependencies:
    ```bash
    npm install
    ```
4. Run the following command to build the extension:
    ```bash
    npm run build
    ```

## Build Output

The compiled extension files will be generated in the `.output/atbc/` directory.
