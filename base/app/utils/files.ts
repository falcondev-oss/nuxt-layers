export function downloadStringAsFile({
  content,
  fileName,
  contentType,
}: {
  content: string | BlobPart
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

export function downloadFileFromUrl({ url, fileName }: { url: string; fileName?: string }) {
  const downloadLink = document.createElement('a')
  downloadLink.href = url
  if (fileName) downloadLink.setAttribute('download', fileName)
  document.body.append(downloadLink)
  downloadLink.click()
  downloadLink.remove()
}
