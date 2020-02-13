/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import chalk, { Chalk } from "chalk";
import { Compiler, Stats } from "webpack";

type StatsFormatter = (stats: Stats.ToJsonOutput) => Stats.ToJsonOutput;

export class PrettyLoggingPlugin {
  private _grouped = false;
  private _isWatch = false;
  private _name: string;
  private _isRebuild: boolean;
  private _startMessage: string;
  private _startTime: number;
  private _successCount: number;
  private _onSuccess: (count: number) => any;
  private _formatter: StatsFormatter;

  constructor(name: string, startMessage: string, onSuccess?: () => void, formatter?: StatsFormatter) {
    this._name = name;
    this._isRebuild = false;
    this._startMessage = startMessage;
    this._startTime = Date.now();
    this._successCount = 0;
    this._onSuccess = onSuccess || (() => { });
    this._formatter = formatter || ((s) => s);
  }

  get isInteractive() { return process.stdout.isTTY && this._isWatch; }

  private clearIfInteractive() {
    if (this.isInteractive) {
      const isWindows = process.platform === "win32";
      process.stdout.write((isWindows) ? "\x1B[2J\x1B[0f" : "\x1B[2J\x1B[3J\x1B[H");
    }
  }

  private printHeading(message: string, color?: string, elapsed?: number) {
    if (this._grouped)
      console.groupEnd();

    const newline = (this.isInteractive) ? "\n" : "";
    const myChalk: Chalk = (color) ? (chalk as any)[color] : chalk;
    if (elapsed)
      console.log(`${newline + myChalk.inverse(this._name)} ${myChalk.bold(message) + chalk.gray("   (in " + elapsed.toLocaleString() + " ms)") + newline}`);
    else
      console.log(`${newline + myChalk.inverse(this._name)} ${myChalk.bold(message) + newline}`);

    console.group();
    this._grouped = true;
  }

  // Reformats warnings and errors with react-dev-utils.
  private handleWarningsAndErrors(elapsed: number, stats: any) {
    const { errors, warnings } = this._formatter(stats.toJson({}, true));
    if (errors.length)
      throw new Error(errors.join("\n\n"));

    if (warnings.length > 0) {
      if (process.env.CI) {
        console.log(chalk.yellow(`\nTreating warnings as errors because process.env.CI is set.\nMost CI servers set it automatically.\n`));
        throw new Error(warnings.join("\n\n"));
      } else if (process.env.TF_BUILD) {
        console.log(chalk.yellow(`\nTreating warnings as errors because process.env.TF_BUILD is set.\nTFS sets this automatically.\n`));
        throw new Error(warnings.join("\n\n"));
      }

      if (this.isInteractive)
        this.printHeading("Compiled with warnings", "yellow", elapsed);
      console.log(warnings.join("\n\n"));
      console.log(`\nSearch for the ${chalk.underline(chalk.yellow("keywords"))} to learn more about tslint warnings.`);
      console.log(`To ignore a tslint warning, add ${chalk.cyan("// tslint-disable-next-line")} to the line before.\n`);
      if (!this.isInteractive)
        this.printHeading("Compiled with warnings", "yellow", elapsed);
      return false;
    }

    return true;
  }

  public apply(compiler: Compiler) {
    compiler.hooks.entryOption.tap("PrettyLoggingPlugin", () => {
      this.printHeading(this._startMessage);
    });

    compiler.hooks.watchRun.tap("PrettyLoggingPlugin", () => {
      this._isWatch = true;
      this._startTime = Date.now();
    });

    compiler.hooks.invalid.tap("PrettyLoggingPlugin", () => {
      this._isRebuild = true;
      this._startTime = Date.now();
      this.clearIfInteractive();
      this.printHeading("Files changed, rebuilding...");
    });

    compiler.hooks.done.tap("PrettyLoggingPlugin", (stats) => {
      this.clearIfInteractive();
      const elapsed = Date.now() - this._startTime;

      let isSuccessful;
      try {
        isSuccessful = this.handleWarningsAndErrors(elapsed, stats);
      } catch (err) {
        if (!this.isInteractive)
          this.printHeading("Failed to compile", "red", elapsed);
        isSuccessful = false;
        console.log();
        console.log(err.message || err);
        console.log();
        if (!this.isInteractive)
          this.printHeading("Failed to compile", "red", elapsed);
        if (!this._isWatch)
          throw err;
      }

      if (isSuccessful) {
        const build = (this._isRebuild) ? "Rebuild" : "Build";
        this.printHeading(build + " completed successfully!", "green", elapsed);
        this._successCount++;
        this._onSuccess(this._successCount);
      }
    });
  }
}
