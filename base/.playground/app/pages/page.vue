<template>
  <LayoutPage
    :header="{
      items: [
        {
          label: 'test',
          to: '/',
        },
      ],
    }"
    :footer="{
      items: [
        {
          label: 'hallo',
          to: '/',
        },
      ],
    }"
  >
    <UContainer>test</UContainer>
  </LayoutPage>
</template>
