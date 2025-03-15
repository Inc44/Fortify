const vscode = require('vscode');
const beautify = require('js-beautify');
const prettier = require('prettier');
const jsBeautifyCfg = {
	brace_style: "expand",
	break_chained_methods: true,
	comma_first: false,
	e4x: false,
	end_with_newline: false,
	indent_char: "\t",
	indent_empty_lines: false,
	indent_inner_html: false,
	indent_scripts: "normal",
	indent_size: "1",
	jslint_happy: false,
	keep_array_indentation: false,
	max_preserve_newlines: "-1",
	preserve_newlines: false,
	space_before_conditional: true,
	unescape_strings: false,
	wrap_line_length: "0"
};
const prettierCfg = {
	php:
	{
		parser: 'php',
		tabWidth: 4,
		useTabs: true,
	}
};

function applyFormat(doc, formatted)
{
	const allTextRange = new vscode.Range(doc.positionAt(0), doc.positionAt(doc.getText()
		.length));
	return [vscode.TextEdit.replace(allTextRange, formatted)];
}

function formatJSBeautify(doc, lang)
{
	const text = doc.getText();
	let formatted = '';
	switch (lang)
	{
		case 'html':
			formatted = beautify.html(text, jsBeautifyCfg);
			break;
		case 'css':
			formatted = beautify.css(text, jsBeautifyCfg);
			break;
		case 'js':
		case 'json':
			formatted = beautify.js(text, jsBeautifyCfg);
			break;
		default:
			return [];
	}
	return applyFormat(doc, formatted);
}
async function formatPrettier(doc, cfg)
{
	const text = doc.getText();
	const formatted = await prettier.format(text, cfg);
	return applyFormat(doc, formatted);
}
async function activate(ctx)
{
	const formatters = {
		'css': (doc) => formatJSBeautify(doc, 'css'),
		'html': (doc) => formatJSBeautify(doc, 'html'),
		'javascript': (doc) => formatJSBeautify(doc, 'js'),
		'json': (doc) => formatJSBeautify(doc, 'json'),
		'php': (doc) => formatPrettier(doc, prettierCfg.php),
	};

	function registerFormatter(lang, formatter)
	{
		const provider = vscode.languages.registerDocumentFormattingEditProvider(lang,
		{
			async provideDocumentFormattingEdits(doc)
			{
				if (formatter)
				{
					return await formatter(doc);
				}
				return [];
			}
		});
		ctx.subscriptions.push(provider);
	}
	for (const lang in formatters)
	{
		registerFormatter(lang, formatters[lang]);
	}
	const cmd = vscode.commands.registerCommand('fortifyFormatter.formatDocument', async () =>
	{
		const editor = vscode.window.activeTextEditor;
		if (!editor)
		{
			return;
		}
		const doc = editor.document;
		const lang = doc.languageId;
		if (formatters[lang])
		{
			const edits = await formatters[lang](doc);
			const edit = new vscode.WorkspaceEdit();
			edits.forEach(e =>
			{
				edit.replace(doc.uri, e.range, e.newText);
			});
			await vscode.workspace.applyEdit(edit);
		}
		else
		{
			await vscode.commands.executeCommand('editor.action.formatDocument');
		}
	});
	ctx.subscriptions.push(cmd);
}

function deactivate()
{}
module.exports = {
	activate,
	deactivate
};