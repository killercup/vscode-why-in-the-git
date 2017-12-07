import {AssertionError} from "assert";
import * as vscode from "vscode";
import CommitMessageDocument, {
  COMMIT_MESSAGE_VIEW_CONTENT,
  GIT_SHOW_MARKDOWN_FORMAT,
} from "./commit-message-document";
import { getCommitMessage, gitAvailable, inGitRepo } from "./git";

export async function activate(context: vscode.ExtensionContext) {
  const provider = new CommitMessageDocument();
  const registration = vscode.workspace.registerTextDocumentContentProvider("git-commit-message", provider);

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

      const { message } = await getCommitMessage(GIT_SHOW_MARKDOWN_FORMAT);
      COMMIT_MESSAGE_VIEW_CONTENT.body = message;

      const previewUri = vscode.Uri.parse(`git-commit-message://fany-interactive-thing`);
      await vscode.commands.executeCommand(
        "vscode.previewHtml",
        previewUri,
        vscode.ViewColumn.Two,
        "Git commit message for this line",
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
