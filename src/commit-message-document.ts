import * as markdownIt from "markdown-it";
import * as vscode from "vscode";
import { getCommit } from "./git";

const md = markdownIt({
  html: false,
  linkify: true,
});

const CSS = `
.hash { font-size: 1em; }
h1 { font-size: 1.8em; font-weight: bold; }
hr { display: block; margin: 2em 1em 1em; width: 40%; border-color: #ccc; border-style: solid; }
hr + ul { padding-left: 0; margin-left: 1em; font-size: 0.95em; }
`;

export const GIT_SHOW_MARKDOWN_FORMAT = [
  "`%H`",
  "### _%aN_, %ar",
  "# %s",
  "%b",
  "- - - -",
  "- written by _%aN_ on %aD",
  "- commited by _%cN_ on %cD",
].join("%n%n");

export default class CommitMessageDocument implements vscode.TextDocumentContentProvider {
  public async provideTextDocumentContent(uri: vscode.Uri): Promise<string> {
    const hash = uri.path.slice(1); // cut of leading slash
    const message = await getCommit(hash, GIT_SHOW_MARKDOWN_FORMAT);
    return this.showCommitMessage(message);
  }

  private async showCommitMessage(body: string) {
    try {
      return `
        <body>
          <style>${CSS}</style>
          ${md.render(body)}
        </body>
      `;
    } catch (error) {
      vscode.window.showErrorMessage(`Error rendering commit message: ${error.message}`);
      console.error(error);
      return "";
    }
  }
}
