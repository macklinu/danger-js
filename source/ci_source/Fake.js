// @flow
"use strict"

import type { Env } from "./ci_source"
import { ensureEnvKeysExist } from "./ci_source_helpers"

export default class FakeCI {
  env: Env
  constructor(env: Env) {
    const defaults = {
      repo: env.DANGER_TEST_REPO || "artsy/emission",
      pr: env.DANGER_TEST_PR || "327"
    }

    this.env = {...env, ...defaults}
  }
  get name(): string { return "Fake Testing CI" }

  get isCI(): boolean { return ensureEnvKeysExist(this.env, ["DANGER_FAKE_CI"]) }
  get isPR(): boolean { return true }

  get pullRequestID(): string { return this.env.pr }
  get repoSlug(): string { return this.env.repo }
  get supportedPlatforms(): string[] { return ["github"] }
}
