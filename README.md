# Fortify Formatter VSCode Extension

A formatter for various languages with specific configurations.

## Features

Provides formatting for:
- HTML, CSS, and JavaScript using js-beautify with custom configuration
- Python using Black with additional processing
- PHP using Prettier with tabulation
- Rust using rustfmt

## Requirements

For this extension to work properly, you need to have the following tools installed:

- For Python: `black` formatter
	```
	pip install black
	```

- For Rust: `rustfmt`
	```
	rustup component add rustfmt
	```

## Extension Settings

This extension contributes the following settings:

- `fortifyFormatter.blackPath`: Path to the Black formatter executable (default: "black")
- `fortifyFormatter.rustfmtPath`: Path to the rustfmt executable (default: "rustfmt")

## Usage

- Open a file of a supported language.
- Use the VSCode "Format Document" command (Ctrl+Shift+P).
- The document will be formatted according to the defined rules for that language.