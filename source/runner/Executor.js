// @flow

import { Dangerfile } from "../runner/Dangerfile"
import { DangerDSL } from "../dsl/DangerDSL"
import type { CISource } from "../ci_source/ci_source"
import { Platform } from "../platforms/platform"
import type { DangerResults } from "../runner/DangerResults"
import githubResultsTemplate from "./templates/github-issue-template"

// This is still badly named, maybe it really should just be runner?

export default class Executor {
  ciSource: CISource
  platform: Platform
  dangerfile: Dangerfile

  constructor(ciSource: CISource, platform: Platform) {
    this.ciSource = ciSource
    this.platform = platform
  }

  /**
   *  Runs all of the operations for a running just Danger
   * @returns {void} It's a promise, so a void promise
   */
  async runDanger() {
    await this.setup()
    const results = await this.run()
    await this.handleResults(results)
  }

  /** Sets up all the related objects for running the Dangerfile
  * @returns {void} It's a promise, so a void promise
  */
  async setup() {
    const git = await this.platform.getReviewDiff()
    const pr = await this.platform.getReviewInfo()
    const dsl = new DangerDSL(pr, git)
    this.dangerfile = new Dangerfile(dsl)
  }

  /**
   * Runs the current dangerfile
   * @returns {DangerResults} Returns the results of the Danger run
   */
  async run(): Promise<DangerResults> {
    return await this.dangerfile.run("dangerfile.js")
  }

  /**
   * Handle the messaing aspects of running a Dangerfile
   * @returns {void} It's a promise, so a void promise
   * @param {DangerResults} results a JSON representation of the end-state for a Danger run
   */
  async handleResults(results: DangerResults) {
    // Ensure process fails if there are fails
    if (results.fails.length) {
      process.exitCode = 1
    }

    // Delete the message if there's nothing to say
    const hasMessages =
      results.fails.length > 0 ||
      results.warnings.length > 0 ||
      results.messages.length > 0 ||
      results.markdowns.length > 0

    if (!hasMessages) {
      console.log("All Good.")
      await this.platform.deleteMainComment()
    } else {
      console.log("Failed")
      const comment = githubResultsTemplate(results)
      await this.platform.updateOrCreateComment(comment)
    }
  }
}
