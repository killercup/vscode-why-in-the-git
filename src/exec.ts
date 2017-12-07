import {execFile as _execFile, ExecFileOptions} from "child_process";

export default function exec(
  cmd: string,
  args: string[],
  options: ExecFileOptions = {},
): Promise<{ stdout: string, stderr: string }> {
  return new Promise((resolve, reject) => {
    _execFile(cmd, args, options, (error, stdout, stderr) => {
      if (error) {
        reject({error, stdout, stderr});
      } else {
        resolve({stdout, stderr});
      }
    });
  });
}
