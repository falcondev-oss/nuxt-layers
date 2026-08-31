import type { templateParts } from '../../utils/display'
import { UBadge } from '#components'

export default defineSetupComponent(
  (_: {
    props: {
      text: ReturnType<typeof templateParts>
    }
  }) =>
    options(_, {
      name: 'TemplateText',
      props: ['text'],
      emits: [],
      setup: (props) => () => (
        <p>
          {props.text.strings.map((string, index) => (
            <span key={index}>
              <span>{string}</span>
              {props.text.values[index] ? (
                <strong class="font-semibold">
                  <UBadge variant="soft" color="neutral" size="lg" class="h-6! p-1! font-semibold">
                    {props.text.values[index]}
                  </UBadge>
                </strong>
              ) : null}
            </span>
          ))}
        </p>
      ),
    }),
)
