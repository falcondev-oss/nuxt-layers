import type { FileUploadEmits, FileUploadProps } from '@nuxt/ui'
import { UFileUpload } from '#components'

export default defineSetupComponent(
  <Multiple extends boolean = false>(_: {
    props: FileUploadProps<Multiple> & {
      modelValue?: (Multiple extends true ? File[] : File) | null
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
    // the rest reaches `UFileUpload` as inherited attributes
    propKeys: 'modelValue' | 'multiple' | 'compression'
    emits: AsEmits<FileUploadEmits> & {
      'compressed': (event: {
        original: File
        compressed: File
        savedBytes: number
        savedPercentage: number
      }) => void
      'update:modelValue': (value: (Multiple extends true ? File[] : File) | null) => void
    }
  }) =>
    options(_, {
      name: 'UInputFile',
      props: ['modelValue', 'multiple', 'compression'],
      emits: ['change', 'compressed', 'update:modelValue'],
      setup: (props, { emit }) => {
        type Files = Multiple extends true ? File[] : File

        const compression = () => props.compression ?? true

        const compressedFiles = new WeakMap<File, File>()

        async function compressImage(file: File) {
          const option = compression()
          if (option === false) return file
          if (compressedFiles.has(file)) return compressedFiles.get(file)!

          const maxDimension = typeof option === 'object' ? (option.maxDimension ?? 1920) : 1920
          const quality = typeof option === 'object' ? (option.quality ?? 0.85) : 0.85
          const outputType =
            typeof option === 'object' ? (option.outputType ?? 'image/webp') : 'image/webp'

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

                // eslint-disable-next-line unicorn/no-unsafe-string-replacement -- the extension comes from `outputType`, not from user input
                const name = file.name.replace(/\.\w+$/, `.${outputType.split('/', 2)[1]}`)
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

        async function forwardFiles(files: File | File[] | null | undefined) {
          if (!files) {
            emit('update:modelValue', files ?? null)
            return
          }

          const filesArray = Array.isArray(files) ? files : [files]
          const compressed = await Promise.all(
            filesArray.map(async (file) => {
              if (!file.type.startsWith('image/')) return file
              return compressImage(file)
            }),
          )

          emit('update:modelValue', (props.multiple ? compressed : compressed[0]!) as Files)
        }

        return () => (
          <UFileUpload
            multiple={props.multiple}
            modelValue={props.modelValue}
            onUpdate:modelValue={(files) => {
              void forwardFiles(files)
            }}
            onChange={(event) => emit('change', event)}
          />
        )
      },
    }),
)
