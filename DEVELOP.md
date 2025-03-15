File: DEVELOP.md
# Development Guide

## Prerequisites

- Node.js
- Visual Studio Code

## Packaging the Extension

To create a VSIX file for distribution:

1. Install dependencies:
	```powershell
	npm install  # or pnpm install
	```
2. Build:
	```powershell
	vsce package
	```
3. This will create a `.vsix` file in the current directory.
4. Move:
	```powershell
	mv fortify-formatter-*.*.*.vsix vsix
	```

## Installation

- Download the VSIX file.
- Open VSCode.
- Go to Extensions.
- Click on the "..." menu in the upper right corner.
- Select "Install from VSIX..."
- Choose the downloaded VSIX file.