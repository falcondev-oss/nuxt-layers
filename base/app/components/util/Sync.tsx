function renderNothing() {
  return null
}

export default defineSetupComponent(
  <T,>(_: {
    props: {
      input: T
      output: T
      deep?: boolean
      once?: boolean
    }
    emits: {
      'update:output': (value: T) => void
    }
  }) =>
    options(_, {
      name: 'Sync',
      props: ['input', 'output', 'deep', 'once'],
      emits: ['update:output'],
      setup: (props, { emit }) => {
        watch(
          () => props.input,
          () => {
            emit('update:output', props.input)
          },
          {
            immediate: true,
            deep: props.deep,
            once: props.once,
          },
        )

        return renderNothing
      },
    }),
)
