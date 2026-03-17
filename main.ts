import * as obsidian from "obsidian";
import { Extension } from "@codemirror/state";
import { editorPlugin } from "src/EditorPlugin";
import { graphlessLinksPostProcessor } from "src/PostProcessor";
import { GraphlessLinkSuggester } from "src/LinkSuggestor";

// The main plugin class
export default class GraphlessLinksPlugin extends obsidian.Plugin {
	editorPlugin: Extension;
	linkSuggester: GraphlessLinkSuggester;

	async onload() {
		this.editorPlugin = editorPlugin(this.app);
		this.registerEditorExtension(this.editorPlugin);
		this.registerMarkdownPostProcessor(graphlessLinksPostProcessor(this.app));

		this.linkSuggester = new GraphlessLinkSuggester(this.app);
		this.registerEditorSuggest(this.linkSuggester);
	}

	onunload() { }
}
