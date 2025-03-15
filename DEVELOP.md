# Development Guide

## Prerequisites

- Node.js
- Visual Studio Code

## Setup

1. Clone the repository.
2. Run `npm install` to install dependencies.
3. Open the project in VS Code.

## Packaging the Extension

To create a VSIX file for distribution:

1. Install vsce:
	```
	npm install -g @vscode/vsce
	```
2. Run:
	```
	npm run package
	```
3. This will create a `.vsix` file in the current directory.

## Installation

- Download the VSIX file.
- Open VSCode.
- Go to Extensions.
- Click on the "..." menu in the upper right corner.
- Select "Install from VSIX..."
- Choose the downloaded VSIX file.