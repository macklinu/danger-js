var fs = require("fs")
var fileOutput = ""

fs.readdir("source/dsl", (err, files) => {
  if (err) { return console.log("Could not read DSL folder") }
  for (var file of files) {
    // Sometimes they have more stuff, in those cases
    // offer a way to crop the file.
    const content = fs.readFileSync(`source/dsl/${file}`).toString()
    if (content.includes("/* END FLOWTYPE")) {
      fileOutput += content.split("/* END FLOWTYPE")[0]
    } else {
      fileOutput += content
    }
  }

  // The definition of all the exposed vars is inside
  // the Dangerfile.js file.
  const allDangerfile = fs.readFileSync("source/runner/Dangerfile.js").toString()
  const moduleContext = allDangerfile.split("BEGIN FLOWTYPE EXPORT */")[1].split("/* END FLOWTYPE")[0]

  // we need to add either `declare function` or `declare var` to the interface
  const context = moduleContext.split("\n").map((line) => {
    if ((line.length === 0) || (line.includes("*"))) { return line }
    if (line.includes("(")) { return "  declare function " + line.trim() }
    if (line.includes(":")) { return "  declare var " + line.trim() }
  }).join("\n")

  const exportModule = `
declare module "danger" {
  ${context}
}
`
  fileOutput += exportModule

  // Remove all JS-y bits
  fileOutput = fileOutput.split("\n").filter((line) => {
    return !line.startsWith("import type") &&
        !line.startsWith('"use strict"') &&
        !line.startsWith("// @flow") &&
        !line.includes("* @type ")
  }).join("\n")

  // We don't export in  the definitions files
  fileOutput = fileOutput.replace(/export interface/gi, "interface")

  // Remove any 2 line breaks
  const flowTyped = fileOutput.replace(/\n\s*\n/g, "\n")

  // This is so you can get it for this repo 👍
  fs.writeFileSync("flow-typed/npm/danger_v0.x.x.js", flowTyped)
  console.log("Awesome - shipped to flow-typed/npm/danger_v0.x.x.js")
  console.log("This should get sent to the main repo.")

  // We want to create another variant - specifically for inlining into the npm module
  // This version specifically does not have the declarations, but is the original
  const inlineFlow = flowTyped.replace('declare module "danger" {', "")
  const inlineDefinition = inlineFlow.replace(/declare/g, "")
  const withoutLastBrace = inlineDefinition.substring(0, inlineDefinition.lastIndexOf("}"))
  fs.writeFileSync("distribution/danger.js.flow", withoutLastBrace)
  console.log("Awesome - shipped to distribution/danger.js.flow")
  console.log("This will get sent off with the npm modile.")
})
