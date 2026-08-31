import type { VNode } from 'vue'
import { useImage } from '@vueuse/core'
import { USkeleton } from '#components'

export default defineSetupComponent(
  (_: {
    props: {
      src?: string
      alt?: string
      fallbackSrc?: string
    }
    slots: {
      default: () => VNode[]
    }
  }) =>
    options(_, {
      name: 'UImageWithFallback',
      props: ['src', 'alt', 'fallbackSrc'],
      emits: [],
      setup: (props, { slots, attrs }) => {
        const { error, isReady } = props.src
          ? useImage(() => ({
              src: props.src ?? '',
            }))
          : {
              isReady: false,
              error: true,
            }

        return () => {
          if (toValue(isReady)) return <img src={props.src} alt={props.alt} />
          if (!toValue(error)) return <USkeleton />

          return (
            <div>
              {slots.default?.() ??
                (props.fallbackSrc ? (
                  <img src={props.fallbackSrc} {...attrs} />
                ) : (
                  <USkeleton {...attrs} />
                ))}
            </div>
          )
        }
      },
    }),
)
