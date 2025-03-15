const vscode = require('vscode');
const
{
	execSync
} = require('child_process');
const fs = require('fs');
const tmp = require('tmp');
const beautify = require('js-beautify');
const prettier = require('prettier');
const jsbeautifyConfig = {
	"indent_size": "1",
	"indent_char": "\t",
	"max_preserve_newlines": "-1",
	"preserve_newlines": false,
	"keep_array_indentation": false,
	"break_chained_methods": true,
	"indent_scripts": "normal",
	"brace_style": "expand",
	"space_before_conditional": true,
	"unescape_strings": false,
	"jslint_happy": false,
	"end_with_newline": false,
	"wrap_line_length": "0",
	"indent_inner_html": false,
	"comma_first": false,
	"e4x": false,
	"indent_empty_lines": false
};

function activate(context)
{
	const htmlFormatter = vscode.languages.registerDocumentFormattingEditProvider('html',
	{
		provideDocumentFormattingEdits(document)
		{
			return formatWithJsBeautify(document, 'html');
		}
	});
	const cssFormatter = vscode.languages.registerDocumentFormattingEditProvider('css',
	{
		provideDocumentFormattingEdits(document)
		{
			return formatWithJsBeautify(document, 'css');
		}
	});
	const jsFormatter = vscode.languages.registerDocumentFormattingEditProvider('javascript',
	{
		provideDocumentFormattingEdits(document)
		{
			return formatWithJsBeautify(document, 'js');
		}
	});
	const jsonFormatter = vscode.languages.registerDocumentFormattingEditProvider('json',
	{
		provideDocumentFormattingEdits(document)
		{
			return formatWithJsBeautify(document, 'json');
		}
	});
	const pythonFormatter = vscode.languages.registerDocumentFormattingEditProvider('python',
	{
		provideDocumentFormattingEdits(document)
		{
			return formatPython(document);
		}
	});
	const phpFormatter = vscode.languages.registerDocumentFormattingEditProvider('php',
	{
		provideDocumentFormattingEdits(document)
		{
			return formatPHP(document);
		}
	});
	const rustFormatter = vscode.languages.registerDocumentFormattingEditProvider('rust',
	{
		provideDocumentFormattingEdits(document)
		{
			return formatRust(document);
		}
	});
	let disposable = vscode.commands.registerCommand('fortifyFormatter.formatDocument', async () =>
	{
		const editor = vscode.window.activeTextEditor;
		if (editor)
		{
			try
			{
				await vscode.commands.executeCommand('editor.action.formatDocument');
			}
			catch (error)
			{
				vscode.window.showErrorMessage(`Error during formatting: ${error.message}`);
			}
		}
	});
	context.subscriptions.push(htmlFormatter, cssFormatter, jsFormatter, jsonFormatter, pythonFormatter, phpFormatter, rustFormatter, disposable);
}

function getExtensionSetting(name, defaultValue)
{
	const config = vscode.workspace.getConfiguration('fortifyFormatter');
	return config.get(name, defaultValue);
}

function formatWithJsBeautify(document, type)
{
	const text = document.getText();
	let formattedText = '';
	switch (type)
	{
		case 'html':
			formattedText = beautify.html(text, jsbeautifyConfig);
			break;
		case 'css':
			formattedText = beautify.css(text, jsbeautifyConfig);
			break;
		case 'js':
			formattedText = beautify.js(text, jsbeautifyConfig);
			break;
		case 'json':
			formattedText = beautify.js(text, jsbeautifyConfig);
			break;
		default:
			formattedText = text;
	}
	return [new vscode.TextEdit(new vscode.Range(document.positionAt(0), document.positionAt(text.length)), formattedText)];
}

function formatPython(document)
{
	const text = document.getText();
	const tmpFile = tmp.fileSync(
	{
		postfix: '.py'
	});
	fs.writeFileSync(tmpFile.name, text);
	try
	{
		const blackPath = getExtensionSetting('blackPath', 'black');
		execSync(`"${blackPath}" "${tmpFile.name}"`,
		{
			stdio: 'pipe'
		});
		let formattedText = fs.readFileSync(tmpFile.name, 'utf8');
		let prevText = '';
		while (prevText !== formattedText)
		{
			prevText = formattedText;
			formattedText = formattedText.replace(/\n\n/g, '\n');
		}
		fs.writeFileSync(tmpFile.name, formattedText);
		execSync(`"${blackPath}" "${tmpFile.name}"`,
		{
			stdio: 'pipe'
		});
		formattedText = fs.readFileSync(tmpFile.name, 'utf8');
		formattedText = formattedText.replace(/    /g, '\t');
		return [new vscode.TextEdit(new vscode.Range(document.positionAt(0), document.positionAt(text.length)), formattedText)];
	}
	catch (error)
	{
		vscode.window.showErrorMessage(`Error formatting Python: ${error.message}`);
		return [];
	}
	finally
	{
		tmpFile.removeCallback();
	}
}
async function formatPHP(document)
{
	const text = document.getText();
	try
	{
		const formattedText = await prettier.format(text,
		{
			parser: 'php',
			tabWidth: 4,
			useTabs: true
		});
		return [new vscode.TextEdit(new vscode.Range(document.positionAt(0), document.positionAt(text.length)), formattedText)];
	}
	catch (error)
	{
		vscode.window.showErrorMessage(`Error formatting PHP: ${error.message}`);
		return [];
	}
}

function formatRust(document)
{
	const text = document.getText();
	const tmpFile = tmp.fileSync(
	{
		postfix: '.rs'
	});
	fs.writeFileSync(tmpFile.name, text);
	try
	{
		const rustfmtPath = getExtensionSetting('rustfmtPath', 'rustfmt');
		execSync(`"${rustfmtPath}" "${tmpFile.name}"`,
		{
			stdio: 'pipe'
		});
		const formattedText = fs.readFileSync(tmpFile.name, 'utf8');
		return [new vscode.TextEdit(new vscode.Range(document.positionAt(0), document.positionAt(text.length)), formattedText)];
	}
	catch (error)
	{
		vscode.window.showErrorMessage(`Error formatting Rust: ${error.message}`);
		return [];
	}
	finally
	{
		tmpFile.removeCallback();
	}
}

function deactivate()
{}
module.exports = {
	activate,
	deactivate
};