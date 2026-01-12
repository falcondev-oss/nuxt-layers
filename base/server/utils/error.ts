const ignoreStackLinesRegEx = /\(<anonymous>\)|node_modules|node:internal/
const indexRegEx = /index \d+/

export function filterStackLines(error: Error) {
  if (error.cause instanceof Error && error.cause.message === error.message) {
    delete error.cause
  }

  error.stack = error.stack
    ?.split(/\n\s*at /)
    .filter((line, index, stack) => {
      if (ignoreStackLinesRegEx.test(line)) return false

      if (indexRegEx.test(line)) {
        const previousItem = stack[index + 1]
        if (!previousItem) return false
        if (ignoreStackLinesRegEx.test(previousItem) || index === stack.length - 1) return false
      }

      return true
    })
    .join('\nat ')
    .trim()
}
