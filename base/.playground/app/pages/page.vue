<template>
  <LayoutPage
    :header="{
      navigation: {
        variant: 'pill',
        items: [
          {
            label: 'test',
            to: '/',
          },
        ],
      },
    }"
    :footer="{
      items: [
        {
          label: 'hallo',
          to: '/',
        },
      ],
      ui: {
        root: 'bg-primary-200',
      },
    }"
  >
    <UContainer>test</UContainer>
  </LayoutPage>
</template>
