<script setup lang="ts">
import { CardGroup, OddsCalculator } from 'poker-tools'
import { computed, ref, watch } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import LoadingIndicator from '../components/LoadingIndicator.vue'
import PokerCard from '../components/PokerCard.vue'
import { getStrategy, getTable } from '../api'
import type { StrategyInfo } from '../api'

const props = defineProps<{
  id: number
}>()

const { data: table, isPending, refetch } = useQuery({
  queryKey: ['table', props.id],
  queryFn: () => getTable(props.id),
  refetchInterval: 1000
})

watch(() => props.id, () => {
  refetch()
})

const getStrategyPrepare = () => {
  let cards: StrategyInfo = {
    format: '3blinds-ante',
    state: `${convertedString.value}:1000|1000|1000|1000`
  }
  // let urlEncodedData  = new URLSearchParams(cards).toString()
  getStrategy(JSON.stringify(cards))
}

const { data: strategy, isPending: isPendingStrategy } = useQuery({
  queryKey: ['strategy'],
  queryFn: () => getStrategyPrepare
})

const convertedString = computed(() => {
  return table.value?.holeCards.map(arr => arr?.join('')).join('|');
})

let winnerIndex = ref<number>(-1)
let isRiver = ref<boolean>(false)

const checkWin = () => {
  let boardCardString = table.value?.communityCards.join('')

  const players = table.value?.holeCards.map(arr => CardGroup.fromString(arr?.join('')))
  const board = CardGroup.fromString(boardCardString)

  const result = OddsCalculator.calculateWinner(players, board)

  winnerIndex.value = result.findIndex(subArray =>
    subArray.some(item => item.index === 0)
  )
}

const isWinner = computed(() => {
  return playerIndex => {
    if (winnerIndex.value === -1 || !isRiver.value) return false
    return !(winnerIndex.value + 1 === playerIndex && isRiver.value)
  }
})

watch(() => table.value?.communityCards.length, (newVal) => {
  if (newVal === 5) {
    isRiver.value = true
    checkWin()
  }
  if (newVal < 5) {
    winnerIndex.value = -1
    isRiver.value = false
  }
})

</script>
<template>
  <div class="p-2">
    <LoadingIndicator v-if="isPending" class="ml-auto mr-auto pt-4" />
    <template v-else-if="table">
      <h1 class="text-2xl py-4">{{ table.name }}</h1>
      <div class="grid grid-cols-4 gap-2">
        <template v-for="index in Math.min(4, table.capacity)" :key="index">
          <div
            class="border-solid solid border-2 p-2 rounded-xl flex items-center justify-center gap-2 w-full relative"
            :class="{
              'bg-green-200 border-4 border-black': index === 1,
              'opacity-40': isWinner(index)
            }"
          >
            <template v-if="index === 1">
              <div class="absolute top-0 right-0 z-10 leading-[0]">
                <button
                  class="bg-blue-500 text-white p-1 text-xs rounded-tr-lg rounded-bl-lg"
                  @click="getStrategyPrepare"
                >
                  Ask AI
                </button>
              </div>
            </template>
            <template v-if="table.holeCards[index - 1]?.length">
              <PokerCard
                v-for="card in table.holeCards[index - 1]"
                :key="card"
                :card="card"
                class="transition-opacity duration-1000"
              />
            </template>
            <template v-else><span class="font-bold text-2xl">Folded</span></template>
          </div>
        </template>
      </div>
      <div
        class="p-8 my-2 bg-green-800 rounded-xl flex gap-2 items-center justify-center text-white"
      >
        <template v-if="table.communityCards.length">
          <PokerCard
            v-for="card in table.communityCards"
            :key="card"
            :card="card"
            class="transition-opacity duration-1000"
          />
        </template>
        <template v-else> No cards on table </template>
      </div>
      <div v-if="table.capacity > 4" class="grid grid-cols-4 gap-2">
        <template v-for="index in table.capacity - 4" :key="index + 4">
          <div
            class="border-solid solid border-2 p-2 rounded-xl flex items-center justify-center gap-2 w-full"
            :class="{
              'opacity-40': isWinner(index + 4)
            }"
          >
            <template v-if="table.holeCards[index - 1 + 4]?.length">
              <PokerCard
                v-for="card in table.holeCards[index - 1 + 4]"
                :key="card"
                :card="card"
                class="transition-opacity duration-1000"
              />
            </template>
            <template v-else><span class="font-bold text-2xl">Folded</span></template>
          </div>
        </template>
      </div>
    </template>
  </div>
</template>
