export function downloadStringAsFile({
  content,
  fileName,
  contentType,
}: {
  content: string
  fileName: string
  contentType: string
}) {
  const blob = new Blob([content], { type: `${contentType};charset=utf-8` })
  const url = URL.createObjectURL(blob)

  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  document.body.append(a)

  a.click()
  a.remove()

  URL.revokeObjectURL(url)
}
