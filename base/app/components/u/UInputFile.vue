<script setup lang="ts" generic="Multiple extends boolean = false">
import type { FileUploadEmits, FileUploadProps } from '@nuxt/ui'
import { useForwardPropsEmits } from 'reka-ui'
import { omit } from 'remeda'

const props = defineProps<
  FileUploadProps<Multiple> & {
    /**
     * Set to `false` to disable compression
     */
    compression?:
      | boolean
      | {
          /**
           * @default 1920
           */
          maxDimension?: number
          /**
           * @default 0.85
           */
          quality?: number
          /**
           * @default 'image/webp'
           */
          outputType?: string
        }
  }
>()
const emit = defineEmits<
  FileUploadEmits & {
    compressed: [
      event: {
        original: File
        compressed: File
        savedBytes: number
        savedPercentage: number
      },
    ]
  }
>()
const forwarded = useForwardPropsEmits(props, emit)

type Files = Multiple extends true ? File[] : File
const model = defineModel<Files | null>()

const compressedFiles = new WeakMap<File, File>()
async function forwardFiles(files: File | File[] | null | undefined) {
  if (!files) {
    model.value = files
    return
  }

  const filesArray = Array.isArray(files) ? files : [files]
  const compressed = await Promise.all(
    filesArray.map(async (file) => {
      if (!file.type.startsWith('image/')) return file
      return await compressImage(file)
    }),
  )

  model.value = (forwarded.value.multiple ? compressed : compressed[0]!) as Files
}

async function compressImage(file: File) {
  if (forwarded.value.compression === false) return file
  if (compressedFiles.has(file)) return compressedFiles.get(file)!

  const maxDimension =
    typeof forwarded.value.compression === 'object'
      ? (forwarded.value.compression?.maxDimension ?? 1920)
      : 1920
  const quality =
    typeof forwarded.value.compression === 'object'
      ? (forwarded.value.compression?.quality ?? 0.85)
      : 0.85
  const outputType =
    typeof forwarded.value.compression === 'object'
      ? (forwarded.value.compression?.outputType ?? 'image/webp')
      : 'image/webp'

  const img = new Image()
  await new Promise((resolve, reject) => {
    img.addEventListener('load', resolve)
    img.addEventListener('error', reject)
    img.src = URL.createObjectURL(file)
  })

  const scale = Math.min(1, maxDimension / Math.max(img.width, img.height))
  const canvas = document.createElement('canvas')
  canvas.width = img.width * scale
  canvas.height = img.height * scale
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
  URL.revokeObjectURL(img.src)

  return new Promise<File>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) return reject(new Error('Canvas is empty'))

        const name = file.name.replace(/\.\w+$/, `.${outputType.split('/')[1]}`)
        const compressedFile = new File([blob], name, { type: outputType })

        compressedFiles.set(file, compressedFile)
        compressedFiles.set(compressedFile, compressedFile) // required since we set model value to the compressed file
        resolve(compressedFile)

        emit('compressed', {
          original: file,
          compressed: compressedFile,
          savedBytes: file.size - compressedFile.size,
          savedPercentage: ((file.size - compressedFile.size) / file.size) * 100,
        })
      },
      outputType,
      quality,
    )
    canvas.remove()
  })
}
</script>

<template>
  <UFileUpload
    v-bind="omit(forwarded, ['compression'])"
    @update:model-value="(files) => forwardFiles(files)"
  />
</template>
