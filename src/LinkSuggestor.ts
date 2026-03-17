import {
	EditorSuggest,
	EditorPosition,
	EditorSuggestTriggerInfo,
	EditorSuggestContext,
	Editor,
} from "obsidian";
import { App } from "obsidian";

interface LinkSuggestion {
	title: string;
	path: string;
}

export class GraphlessLinkSuggester extends EditorSuggest<LinkSuggestion> {
	app: App;

	constructor(app: App) {
		super(app);
		this.app = app;
	}

	onTrigger(
		cursor: EditorPosition,
		editor: Editor,
	): EditorSuggestTriggerInfo | null {
		const line = editor.getLine(cursor.line);
		const beforeCursor = line.substring(0, cursor.ch);
		const lastOpenBrace = beforeCursor.lastIndexOf("{{");

		if (lastOpenBrace === -1) return null;

		const afterLastOpen = line.substring(lastOpenBrace + 2);
		const closeIndex = afterLastOpen.indexOf("}}");
		if (closeIndex !== -1 && closeIndex < cursor.ch - lastOpenBrace - 2)
			return null;

		const query = line.substring(lastOpenBrace + 2, cursor.ch);
		const pipeIndex = query.indexOf("|");
		const linkPart = pipeIndex === -1 ? query : query.substring(0, pipeIndex);

		return {
			start: { line: cursor.line, ch: lastOpenBrace + 2 },
			end: cursor,
			query: linkPart,
		};
	}

	getSuggestions(context: EditorSuggestContext): LinkSuggestion[] {
		const { query } = context;
		const suggestions: LinkSuggestion[] = [];

		const files = this.app.vault.getMarkdownFiles();

		for (const file of files) {
			const title = file.basename;
			const path = file.path;

			if (title.toLowerCase().includes(query.toLowerCase())) {
				suggestions.push({ title, path });
			}
		}

		// Deduplicate and limit
		return Array.from(new Map(suggestions.map((s) => [s.path, s])).values())
			.slice(0, 50)
			.reverse();
	}
	renderSuggestion(value: LinkSuggestion, el: HTMLElement): void {
		el.createEl("div", { text: value.title });
		el.createEl("small", {
			text: value.path,
			cls: "obsidian-graphless-suggestion-path",
		});
	}

	selectSuggestion(value: LinkSuggestion): void {
		const editor = this.context?.editor;
		if (!editor) return;

		const cursor = editor.getCursor();
		const line = editor.getLine(cursor.line);

		// Find the opening {{
		const beforeCursor = line.substring(0, cursor.ch);
		const lastOpenBrace = beforeCursor.lastIndexOf("{{");
		if (lastOpenBrace === -1) return;

		// Replace the text inside {{ }} with the suggestion title
		const insertText = value.title;

		editor.replaceRange(
			insertText,
			{ line: cursor.line, ch: lastOpenBrace + 2 },
			cursor,
		);

		// Move the cursor just after the closing braces
		const newCursorCh = lastOpenBrace + 2 + insertText.length + 2; // +2 for closing braces

		editor.setCursor({ line: cursor.line, ch: newCursorCh });
	}
}
