const vscode = require('vscode');
const beautify = require('js-beautify');
const prettier = require('prettier');
const jsbeautifyConfig = {
	"brace_style": "expand",
	"break_chained_methods": true,
	"comma_first": false,
	"e4x": false,
	"end_with_newline": false,
	"indent_char": "\t",
	"indent_empty_lines": false,
	"indent_inner_html": false,
	"indent_scripts": "normal",
	"indent_size": "1",
	"jslint_happy": false,
	"keep_array_indentation": false,
	"max_preserve_newlines": "-1",
	"preserve_newlines": false,
	"space_before_conditional": true,
	"unescape_strings": false,
	"wrap_line_length": "0"
};
async function activate(context)
{
	const cppFormatter = vscode.languages.registerDocumentFormattingEditProvider(['cpp', 'c'],
	{
		async provideDocumentFormattingEdits(document)
		{
			return await formatCPP(document);
		}
	});
	const cssFormatter = vscode.languages.registerDocumentFormattingEditProvider('css',
	{
		provideDocumentFormattingEdits(document)
		{
			return formatWithJsBeautify(document, 'css');
		}
	});
	const goFormatter = vscode.languages.registerDocumentFormattingEditProvider('go',
	{
		async provideDocumentFormattingEdits(document)
		{
			return await formatGo(document);
		}
	});
	const htmlFormatter = vscode.languages.registerDocumentFormattingEditProvider('html',
	{
		provideDocumentFormattingEdits(document)
		{
			return formatWithJsBeautify(document, 'html');
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
	const luaFormatter = vscode.languages.registerDocumentFormattingEditProvider('lua',
	{
		async provideDocumentFormattingEdits(document)
		{
			return await formatLua(document);
		}
	});
	const phpFormatter = vscode.languages.registerDocumentFormattingEditProvider('php',
	{
		provideDocumentFormattingEdits(document)
		{
			return formatPHP(document);
		}
	});
	const pythonFormatter = vscode.languages.registerDocumentFormattingEditProvider('python',
	{
		async provideDocumentFormattingEdits(document)
		{
			return await formatPython(document);
		}
	});
	const sqlFormatter = vscode.languages.registerDocumentFormattingEditProvider('sql',
	{
		async provideDocumentFormattingEdits(document)
		{
			return await formatSql(document);
		}
	});
	const zigFormatter = vscode.languages.registerDocumentFormattingEditProvider('zig',
	{
		async provideDocumentFormattingEdits(document)
		{
			return await formatZig(document);
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
	context.subscriptions.push(htmlFormatter, cssFormatter, jsFormatter, jsonFormatter, pythonFormatter, phpFormatter, goFormatter, cppFormatter, zigFormatter, luaFormatter, sqlFormatter, disposable);
}
async function formatCPP(document)
{
	const text = document.getText();
	try
	{
		const init = (await import("@wasm-fmt/clang-format"))
			.init;
		const format = (await import("@wasm-fmt/clang-format"))
			.format;
		await init();
		const config = JSON.stringify(
		{
			BasedOnStyle: "Chromium",
			IndentWidth: 4,
			TabWidth: 4,
			UseTab: Always,
		});
		const formattedText = format(text, document.fileName, config);
		return [new vscode.TextEdit(new vscode.Range(document.positionAt(0), document.positionAt(text.length)), formattedText)];
	}
	catch (error)
	{
		vscode.window.showErrorMessage(`Error formatting C/C++: ${error.message}`);
		return [];
	}
}
async function formatGo(document)
{
	const text = document.getText();
	try
	{
		const init = (await import("@wasm-fmt/gofmt"))
			.init;
		const format = (await import("@wasm-fmt/gofmt"))
			.format;
		await init();
		const formattedText = format(text);
		return [new vscode.TextEdit(new vscode.Range(document.positionAt(0), document.positionAt(text.length)), formattedText)];
	}
	catch (error)
	{
		vscode.window.showErrorMessage(`Error formatting Go: ${error.message}`);
		return [];
	}
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
async function formatLua(document)
{
	const text = document.getText();
	try
	{
		const init = (await import("@wasm-fmt/lua_fmt"))
			.init;
		const format = (await import("@wasm-fmt/lua_fmt"))
			.format;
		await init();
		const formattedText = format(text, "main.lua");
		return [new vscode.TextEdit(new vscode.Range(document.positionAt(0), document.positionAt(text.length)), formattedText)];
	}
	catch (error)
	{
		vscode.window.showErrorMessage(`Error formatting Lua: ${error.message}`);
		return [];
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
async function formatPython(document)
{
	const text = document.getText();
	try
	{
		const init = (await import("@wasm-fmt/ruff_fmt"))
			.init;
		const format = (await import("@wasm-fmt/ruff_fmt"))
			.format;
		await init();
		const formattedText = format(text,
		{
			indent_style: "tab",
			indent_width: 4,
		});
		return [new vscode.TextEdit(new vscode.Range(document.positionAt(0), document.positionAt(text.length)), formattedText)];
	}
	catch (error)
	{
		vscode.window.showErrorMessage(`Error formatting Python: ${error.message}`);
		return [];
	}
}
async function formatSql(document)
{
	const text = document.getText();
	try
	{
		const init = (await import("@wasm-fmt/sql_fmt"))
			.init;
		const format = (await import("@wasm-fmt/sql_fmt"))
			.format;
		await init();
		const formattedText = format(text, "query.sql");
		return [new vscode.TextEdit(new vscode.Range(document.positionAt(0), document.positionAt(text.length)), formattedText)];
	}
	catch (error)
	{
		vscode.window.showErrorMessage(`Error formatting SQL: ${error.message}`);
		return [];
	}
}
async function formatZig(document)
{
	const text = document.getText();
	try
	{
		const init = (await import("@wasm-fmt/zig_fmt"))
			.init;
		const format = (await import("@wasm-fmt/zig_fmt"))
			.format;
		await init();
		const formattedText = format(text);
		return [new vscode.TextEdit(new vscode.Range(document.positionAt(0), document.positionAt(text.length)), formattedText)];
	}
	catch (error)
	{
		vscode.window.showErrorMessage(`Error formatting Zig: ${error.message}`);
		return [];
	}
}

function deactivate()
{}
module.exports = {
	activate,
	deactivate
};