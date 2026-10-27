import type { TemplateParts } from '../../utils/display'
import { UBadge } from '#components'

export default defineSetupComponent(
  (_: {
    props: {
      text: TemplateParts
    }
  }) =>
    options(_, {
      name: 'TemplateText',
      props: ['text'],
      emits: [],
      // a `span`, so it also fits where only phrasing content is allowed, like a modal description
      setup: (props) => () => (
        <span>
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
        </span>
      ),
    }),
)
