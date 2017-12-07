import {AssertionError} from "assert";
import * as vscode from "vscode";
import CommitMessageDocument from "./commit-message-document";
import { getCommitHash, gitAvailable, inGitRepo } from "./git";

export async function activate(context: vscode.ExtensionContext) {
  const provider = new CommitMessageDocument();
  const registration = vscode.workspace.registerTextDocumentContentProvider("why-in-the-git", provider);

  const disposable = vscode.commands.registerCommand("extension.whyInTheNameOfGit", async () => {
    try {
      const hasGitCommand = await gitAvailable();
      if (!hasGitCommand) {
        vscode.window.showWarningMessage("Git not available");
        return;
      }

      const isInGitRepo = await inGitRepo();
      if (!isInGitRepo) {
        vscode.window.showWarningMessage("Not in a git repository");
        return;
      }

      const hash = await getCommitHash();

      const previewUri = vscode.Uri.parse(`why-in-the-git://git-commit-message/${hash}`);
      await vscode.commands.executeCommand(
        "vscode.previewHtml",
        previewUri,
        vscode.ViewColumn.Two,
        `Commit ${hash.slice(0, 6)}`,
      );
    } catch (error) {
      if (error instanceof AssertionError) {
        vscode.window.showErrorMessage(`Couldn't fetch commit info: ${error.message}. Sorry`);
        console.error(error);
      } else {
        vscode.window.showErrorMessage(`Couldn't fetch commit info, sorry`);
        console.error(error);
      }
    }
  });

  context.subscriptions.push(disposable, registration);
}
