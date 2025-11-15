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
const asmDataOps = {
	equ: true,
	db: true,
	dw: true,
	dd: true,
	dq: true,
	dt: true,
	resb: true,
	resw: true,
	resd: true,
	resq: true,
	rest: true
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

function extractComment(line)
{
	const i = line.indexOf(';');
	if (i === -1) return {
		code: line,
		comment: ''
	};
	const code = line.slice(0, i)
		.trimEnd();
	const comment = line.slice(i + 1)
		.trim();
	return {
		code,
		comment: comment ? '; ' + comment : ''
	};
}

function parseAsmLine(line, section)
{
	const trimmed = line.trim();
	if (!trimmed) return {
		type: 'blank',
		inSection: !!section
	};
	const
	{
		code,
		comment
	} = extractComment(trimmed);
	if (!code) return comment ?
	{
		type: 'comment',
		comment,
		inSection: !!section
	} :
	{
		type: 'blank',
		inSection: !!section
	};
	if (code.toLowerCase()
		.startsWith('section '))
	{
		const name = code.split(/\s+/)[1]?.toLowerCase() || '';
		return {
			type: 'section',
			section: name,
			code: 'section ' + name,
			comment,
			inSection: false
		};
	}
	let label = '',
		mnemonic = '',
		operands = '';
	const labelMatch = /^([A-Za-z_.][A-Za-z0-9_.]*:)\s*(.*)$/.exec(code);
	if (labelMatch)
	{
		label = labelMatch[1];
		const remainder = labelMatch[2].trim();
		if (!remainder) return {
			type: 'code',
			inSection: !!section,
			section: section,
			label,
			mnemonic: '',
			operands: '',
			comment,
			isLabelOnly: true,
			isGlobalLike: false
		};
		const parts = remainder.split(/\s+/);
		mnemonic = parts[0];
		operands = parts.slice(1)
			.join(' ');
	}
	else
	{
		const parts = code.split(/\s+/);
		if (parts.length > 1 && asmDataOps[parts[1].toLowerCase()])
		{
			label = parts[0];
			mnemonic = parts[1];
			operands = parts.slice(2)
				.join(' ');
		}
		else
		{
			mnemonic = parts[0];
			operands = parts.slice(1)
				.join(' ');
		}
	}
	if (operands) operands = operands.replace(/\s+/g, ' ')
		.replace(/\s*,\s*/g, ', ');
	return {
		type: 'code',
		inSection: !!section,
		section: section,
		label,
		mnemonic,
		operands,
		comment,
		isLabelOnly: false,
		isGlobalLike: section && /^global\b/i.test(code)
	};
}

function buildSimpleLine(label, mnemonic, operands, comment)
{
	const parts = [label, mnemonic, operands].filter(Boolean);
	let line = parts.join(' ');
	if (comment) line += (line ? '\t' : '') + comment;
	return line;
}

function buildAlignedLine(parsedLine, section)
{
	let line = '\t';
	if (parsedLine.label)
	{
		line += parsedLine.label + ' '.repeat(Math.max(1, section.maxLabel - parsedLine.label.length + 1));
	}
	else if (section.maxLabel > 0)
	{
		line += ' '.repeat(section.maxLabel + 1);
	}
	if (parsedLine.mnemonic)
	{
		line += parsedLine.mnemonic;
		if (section.maxMnemonic > 0 && (parsedLine.operands || section.maxOperands > 0 || parsedLine.comment))
		{
			line += ' '.repeat(Math.max(1, section.maxMnemonic - parsedLine.mnemonic.length + 1));
		}
	}
	else if (section.maxMnemonic > 0 && (parsedLine.operands || parsedLine.comment))
	{
		line += ' '.repeat(section.maxMnemonic + 1);
	}
	if (parsedLine.operands)
	{
		line += parsedLine.operands;
		if (parsedLine.comment) line += ' '.repeat(Math.max(1, section.maxOperands - parsedLine.operands.length + 1));
	}
	else if (parsedLine.comment && section.maxOperands > 0)
	{
		line += ' '.repeat(section.maxOperands + 1);
	}
	if (parsedLine.comment) line += parsedLine.comment;
	return line.trimEnd();
}

function formatParsedLine(parsedLine, sections)
{
	if (parsedLine.type === 'blank') return '';
	if (parsedLine.type === 'section') return parsedLine.code + (parsedLine.comment ? '\t' + parsedLine.comment : '');
	if (parsedLine.type === 'comment') return (parsedLine.inSection ? '\t' : '') + parsedLine.comment;
	if (parsedLine.type !== 'code') return '';
	if (!parsedLine.inSection || !parsedLine.section) return buildSimpleLine(parsedLine.label, parsedLine.mnemonic, parsedLine.operands, parsedLine.comment);
	if (parsedLine.isLabelOnly) return parsedLine.label + (parsedLine.comment ? '\t' + parsedLine.comment : '');
	if (parsedLine.isGlobalLike) return buildSimpleLine('', parsedLine.mnemonic, parsedLine.operands, parsedLine.comment);
	const section = sections[parsedLine.section] ||
	{
		maxLabel: 0,
		maxMnemonic: 0,
		maxOperands: 0
	};
	return buildAlignedLine(parsedLine, section);
}

function formatAsm(doc)
{
	const lines = doc.getText()
		.split(/\r?\n/);
	const parsedLines = [];
	const sections = {};
	let section = null;
	for (const line of lines)
	{
		const parsedLine = parseAsmLine(line, section);
		parsedLines.push(parsedLine);
		if (parsedLine.type === 'section')
		{
			section = parsedLine.section || null;
			if (section && !sections[section])
			{
				sections[section] = {
					maxLabel: 0,
					maxMnemonic: 0,
					maxOperands: 0
				};
			}
		}
		else if (parsedLine.type === 'code' && parsedLine.inSection && parsedLine.section && !parsedLine.isLabelOnly && !parsedLine.isGlobalLike)
		{
			const section = sections[parsedLine.section] || (sections[parsedLine.section] = {
				maxLabel: 0,
				maxMnemonic: 0,
				maxOperands: 0
			});
			if (parsedLine.label && parsedLine.label.length > section.maxLabel) section.maxLabel = parsedLine.label.length;
			if (parsedLine.mnemonic && parsedLine.mnemonic.length > section.maxMnemonic) section.maxMnemonic = parsedLine.mnemonic.length;
			if (parsedLine.operands && parsedLine.operands.length > section.maxOperands) section.maxOperands = parsedLine.operands.length;
		}
	}
	return applyFormat(doc, parsedLines.map(parsedLine => formatParsedLine(parsedLine, sections))
		.join('\n'));
}
async function activate(ctx)
{
	const formatters = {
		'asm-intel-x86-generic': (doc) => formatAsm(doc),
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