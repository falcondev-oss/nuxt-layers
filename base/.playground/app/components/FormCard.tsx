// import type { VNode } from 'vue'
// import { UCard, UDropdownMenu, UField, UForm, UInput } from '#components'
// import { z } from 'zod'

/* eslint-disable ts/no-empty-object-type */
export default defineSetupComponent((_: { props: { name: string }; emits: {}; slots: {} }) =>
  options(_, {
    props: ['name'],
    emits: [],
    setup: (props) => {
      console.log(props)
      // const form = useForm({
      //   schema: z.object({
      //     duration: z.number().meta({ title: 'Duration' }),
      //     dateIso: z.string().meta({ title: 'Datum' }),
      //     text: z
      //       .string()
      //       .length(8)
      //       // .max(8)
      //       .meta({
      //         title: 'Text',
      //         description: 'Beschreibung',
      //         default: 'Default Wert',
      //         examples: ['Hier könnte ein Beispieltext stehen', '123'],
      //       }),
      //   }),
      //   sourceValues: () => ({
      //     dateIso: null,
      //     duration: null,
      //     text: '',
      //   }),
      //   async submit({ values }) {
      //     await new Promise((resolve) => setTimeout(resolve, 2000))
      //     console.log(values)
      //   },
      // })

      return () => (
        // <UCard
        //   class="max-w-sm"
        //   ui={{
        //     body: 'flex flex-col gap-4 items-start ',
        //   }}
        // >
        //   <UForm form={form} successToast={{ title: 'Success' }} class="flex flex-col gap-4">
        //     {form.data}

        //     {/* <UField
        //       field={form.fields.text.$use()}
        //       error-inline
        //       vSlots={vSlots(UField, {
        //         default({ bind }) {
        //           return <UInput class="w-full" {...bind} />
        //         },
        //       })}
        //     ></UField> */}
        //   </UForm>
        //   {/* <UForm
        //     :form
        //     :success-toast="{
        //       title: 'test',
        //       description: 'wow',
        //     }"
        //     class="flex flex-col gap-4"
        //   >
        //     {{ form.data }}
        //     <UField v-slot="{ bind, field }" :field="form.fields.text.$use()" error-inline>
        //       {{ field.schema }}
        //       <UInput class="w-full" v-bind="bind" />
        //     </UField>
        //     <UField
        //       v-slot="{ bind }"
        //       :field="
        //         form.fields.dateIso.$use({
        //           translate: dateValueIsoTranslator(),
        //         })
        //       "
        //     >
        //       <UInputDatePicker class="w-full" v-bind="bind" />
        //     </UField>
        //     <UField v-slot="{ bind }" :field="form.fields.duration.$use()">
        //       <UInputDurationMinutes class="w-full" v-bind="bind" />
        //     </UField>
        //   </UForm> */}
        // </UCard>
        <></>
      )
    },
  }),
)
