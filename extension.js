const vscode = require('vscode');
const beautify = require('js-beautify');
const prettier = require('prettier');
const jsBeautifyOptions = {
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
const phpFormatConfig = {
	parser: 'php',
	tabWidth: 4,
	useTabs: true
};

function formatWithJsBeautify(document, language)
{
	const text = document.getText();
	let formattedText = '';
	switch (language)
	{
		case 'html':
			formattedText = beautify.html(text, jsBeautifyOptions);
			break;
		case 'css':
			formattedText = beautify.css(text, jsBeautifyOptions);
			break;
		case 'js':
		case 'json':
			formattedText = beautify.js(text, jsBeautifyOptions);
			break;
		default:
			return [];
	}
	return [vscode.TextEdit.replace(new vscode.Range(document.positionAt(0), document.positionAt(text.length)), formattedText)];
}
async function formatWithPrettier(document, config)
{
	const text = document.getText();
	try
	{
		const formattedText = await prettier.format(text, config);
		return [vscode.TextEdit.replace(new vscode.Range(document.positionAt(0), document.positionAt(text.length)), formattedText)];
	}
	catch (error)
	{
		vscode.window.showErrorMessage(`Error formatting: ${error.message}`);
		return [];
	}
}
async function activate(context)
{
	const formatters = {
		'css': () => formatWithJsBeautify(vscode.window.activeTextEditor.document, 'css'),
		'html': () => formatWithJsBeautify(vscode.window.activeTextEditor.document, 'html'),
		'javascript': () => formatWithJsBeautify(vscode.window.activeTextEditor.document, 'js'),
		'json': () => formatWithJsBeautify(vscode.window.activeTextEditor.document, 'json'),
		'php': () => formatWithPrettier(vscode.window.activeTextEditor.document, phpFormatConfig),
	};
	for (const language in formatters)
	{
		const provider = vscode.languages.registerDocumentFormattingEditProvider(language,
		{
			async provideDocumentFormattingEdits(document)
			{
				if (formatters[language])
				{
					return await formatters[language]();
				}
				return [];
			}
		});
		context.subscriptions.push(provider);
	}
	let disposable = vscode.commands.registerCommand('fortifyFormatter.formatDocument', async () =>
	{
		const editor = vscode.window.activeTextEditor;
		if (editor)
		{
			try
			{
				const language = editor.document.languageId
				if (formatters[language])
				{
					let edits = await formatters[language]()
					const edit = new vscode.WorkspaceEdit();
					edits.forEach(e =>
					{
						edit.replace(editor.document.uri, e.range, e.newText);
					});
					await vscode.workspace.applyEdit(edit)
				}
				else
				{
					await vscode.commands.executeCommand('editor.action.formatDocument');
				}
			}
			catch (error)
			{
				vscode.window.showErrorMessage(`Error during formatting: ${error.message}`);
			}
		}
	});
	context.subscriptions.push(disposable);
}

function deactivate()
{}
module.exports = {
	activate,
	deactivate
};