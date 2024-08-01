<template>
  <label
    class="text-center text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800"
  >
    {{ isPending ? 'Loading...' : 'Add table' }}
    <input class="hidden" type="file" @change="handleFileSelect" />
  </label>
  <div v-if="isError">{{ error }}</div>
</template>

<script setup lang="ts">
import { useMutation } from '@tanstack/vue-query'
import { createTable } from '@/api'
import { ref, defineEmits, watch } from 'vue'

const emit = defineEmits(['tableCreated'])

const { isError, error, isSuccess, mutate, data, isPending } = useMutation({
  mutationFn: (table) => createTable(table)
})

const fileContents = ref<string | null>(null)

const handleFileSelect = (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) {
    return
  }
  const reader = new FileReader()
  reader.onload = (e) => {
    const contents = (e.target?.result as string) || ''
    fileContents.value = contents
    const parsedData = parseHandHistory(contents)

    mutate(parsedData)
  }
  reader.readAsText(file)
}

const parseHandHistory = history => {
  const holeCardsPattern = /Seat \d+: .*? \[(.*?)\]/g
  const boardPattern = /Board \[(.*?)\]/

  const holeCards = []
  let match
  while (match = holeCardsPattern.exec(history)) {
    holeCards.push(match[1].split(' '))
  }

  const communityCardsMatch = boardPattern.exec(history)
  const communityCards = communityCardsMatch[1].split(' ')

  return {
    name: 'Imported Table 3',
    capacity: holeCards.length,
    holeCards: holeCards,
    communityCards: communityCards
  }
}

watch(() => isSuccess.value, (newVal) => {
  if (newVal) {
    emit('tableCreated', data.value.id)
  }
})

</script>