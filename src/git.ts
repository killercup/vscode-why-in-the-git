import { AssertionError } from "assert";
import * as vscode from "vscode";
import { TextEditor } from "vscode";
import exec from "./exec";

function getWorkingDir() {
  const workspace = vscode.workspace.workspaceFolders;
  if (!workspace || workspace.length < 1) {
    throw new AssertionError({ message: "no active workspace folder found"});
  }
  const workspaceUri = workspace[0].uri;
  if (workspaceUri.scheme !== "file") {
    throw new AssertionError({ message: "current editor is not accessible via `file://`"});
  }

  return workspaceUri.path;
}

export function gitAvailable(): Promise<boolean> {
  return exec("git", ["--version"])
    .then((_) => true, (_) => false);
}

export function inGitRepo() {
  const cwd = getWorkingDir();

  return exec("git", ["rev-parse", "--show-toplevel"], { cwd })
    .then((_) => true, (_) => false);
}

type CommitHash = string;
type CommitMessage = string;

interface ILine {
  filePath: string;
  line: number;
}

const BLAME_REGEX = new RegExp("([0-9A-Fa-f]{40}) (.*)");

function parsePorcelainBlame(blame: string): CommitHash {
  const matches = BLAME_REGEX.exec(blame);
  if (!matches) { throw new Error("Couldn't parse blame output"); }

  const hash = matches[1];
  return hash;
}

function getActiveLine(editor: TextEditor): ILine {
  return {
    filePath: editor.document.fileName,
    line: editor.selection.active.line,
  };
}

async function getBlameInfoForLine(file: ILine, cwd: string): Promise<string> {
  const line = file.line + 1;
  const { stdout } = await exec("git", [
    "blame", "--porcelain", file.filePath, `-L${line},${line}`,
  ], { cwd });

  return stdout;
}

export async function getCommit(
  commitHash: CommitHash,
  format = "%B",
  givenCwd?: string,
): Promise<CommitMessage> {
  const cwd = givenCwd || getWorkingDir();
  const { stdout } = await exec("git", [
    "show", "--no-patch", `--format=${format}`, commitHash,
  ], { cwd });

  return stdout;
}

export async function getCommitHash(): Promise<CommitHash> {
  const editor = vscode.window.activeTextEditor;
  if (!editor) { throw new AssertionError({ message: "no active editor found"}); }
  const cwd = getWorkingDir();

  const line = getActiveLine(editor);
  const blameInfo = await getBlameInfoForLine(line, cwd);

  const hash = parsePorcelainBlame(blameInfo);
  if (parseInt(hash, 16) === 0) {
    throw new AssertionError({ message: "line is not commited yet"});
  }

  return hash;
}
