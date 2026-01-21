export type AddPropertyPrefix<T extends object, P extends string> = {
  [K in keyof T as `${P}-${K & string}`]: T[K]
}
