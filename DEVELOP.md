# Development

## Prerequisites

- Node.js
- Visual Studio Code

## Make the Extension Package

1.  Get the required files:

	```powershell
	npm install
	```

2.  Make the package:

	```powershell
	vsce package
	```

3.  A `.vsix` file is created in the current directory.

4.  Move (optional):

	```powershell
	mv fortify-formatter-*.*.*.vsix vsix
	```

## Install

- Get the VSIX file.
- Open VSCode.
- Go to Extensions.
- Click the "..." menu in the upper right corner.
- Select "Install from VSIX...".
- Select the VSIX file.