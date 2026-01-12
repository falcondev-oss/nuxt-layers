import type { OverrideProperties } from 'type-fest'

export type Falsy = false | null | undefined | 0 | ''

type TypedBroadcastChannelEventMap<T> = OverrideProperties<
  BroadcastChannelEventMap,
  {
    message: MessageEvent<T>
    messageerror: MessageEvent<T>
  }
>

export interface TypedBroadcastChannel<T> extends BroadcastChannel {
  onmessage: ((this: BroadcastChannel, ev: MessageEvent<T>) => any) | null
  onmessageerror: ((this: BroadcastChannel, ev: MessageEvent<T>) => any) | null
  postMessage: (message: T) => void
  addEventListener: <K extends keyof TypedBroadcastChannelEventMap<T>>(
    type: K,
    listener: (this: BroadcastChannel, ev: TypedBroadcastChannelEventMap<T>[K]) => any,
    options?: boolean | AddEventListenerOptions,
  ) => void
  removeEventListener: <K extends keyof TypedBroadcastChannelEventMap<T>>(
    type: K,
    listener: (this: BroadcastChannel, ev: TypedBroadcastChannelEventMap<T>[K]) => any,
    options?: boolean | EventListenerOptions,
  ) => void
}
