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

1. Install:
	```powershell
	npm install
	```
2. Run:
	```powershell
	npm run package
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