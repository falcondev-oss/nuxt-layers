import type { NavigationMenuItem } from '@nuxt/ui'
import type { InjectionKey, MaybeRefOrGetter, Ref } from 'vue'

export type ToolbarTool = NavigationMenuItem

export const toolbarToolsKey = Symbol('toolbar-tools') as InjectionKey<
  Ref<MaybeRefOrGetter<ToolbarTool>[]>
>

/**
 * Tools of the enclosing `LayoutNavbar`'s toolbar, so that anything rendered inside it — a nested
 * `NuxtPage`, a deeply nested component — can contribute to it. Whoever renders `LayoutNavbar`
 * itself passes its tools as props instead.
 */
export function useToolbar() {
  const injected = inject(toolbarToolsKey)
  if (!injected) throw new Error('useToolbar() has to be called inside a `LayoutNavbar`')
  const toolSources = injected

  /**
   * Appends a tool to the toolbar. Pass a getter to keep the tool reactive.
   *
   * The tool is removed again when the calling scope is disposed, i.e. when the component that
   * added it unmounts.
   */
  function addTool(tool: MaybeRefOrGetter<ToolbarTool>) {
    toolSources.value.push(tool)

    const remove = () => {
      const index = toolSources.value.indexOf(tool)
      if (index !== -1) toolSources.value.splice(index, 1)
    }
    onScopeDispose(remove, true)

    return remove
  }

  return {
    tools: computed(() => toolSources.value.map((tool) => toValue(tool))),
    addTool,
  }
}
