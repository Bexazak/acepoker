<script setup lang="ts">
import { CardGroup, OddsCalculator } from 'poker-tools'
import { computed, ref, watch } from 'vue'
import { useMutation, useQuery } from '@tanstack/vue-query'
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

//--------------------------------

const { data: strategy, isPending: isPendingMutation, mutateAsync, isError } = useMutation({
  mutationFn: (card: StrategyInfo) => getStrategy(card)
})

const getStrategyPrepare = async () => {
  let cardToString = table.value?.holeCards.map(arr => arr?.join('')).join('|')

  let cards = {
    format: '3blinds-ante',
    state: `${cardToString}:1000|1000|1000|1000`
  }

  await mutateAsync(cards)

  if (!isPendingMutation.value) {
    chooseStrategy(strategy.value)
  }
  if (isError.value) {
    alert('Unable to assist you')
  }
}

const chooseStrategy = (data) => {
  if (data) {
    const maxKey = Object.keys(data).reduce((a, b) => data[a] > data[b] ? a : b)
    alert(`Suggested strategy: ${maxKey}`)
  }
}

//--------------------------------

interface Card {
  rank: number;
  suit: number;
}

interface HandRank {
  rank: number;
  highcards: {
    cards: Card[];
  };
}

interface PlayerHand {
  index: number;
  handrank: HandRank;
}

const compareHands = (hand1: HandRank, hand2: HandRank): number => {
  if (hand1.rank > hand2.rank) {
    return 1
  } else if (hand1.rank < hand2.rank) {
    return -1
  } else {
    // Compare high cards in hand (if rank is equal)
    for (let i = 0; i < hand1.highcards.cards.length; i++) {
      if (hand1.highcards.cards[i].rank > hand2.highcards.cards[i].rank) {
        return 1
      } else if (hand1.highcards.cards[i].rank < hand2.highcards.cards[i].rank) {
        return -1
      }
    }
    return 0
  }
}

const checkWin = (hands: string[], board: string[]): number[] => {
  const cardGroups = hands.map(hand => CardGroup.fromString(hand))
  const boardGroup = CardGroup.fromString(board)
  const result = OddsCalculator.calculateWinner(cardGroups, boardGroup)

  let winningHands: PlayerHand[] = [result[0][0]]

  for (const playerHands of result) {
    for (const playerHand of playerHands) {
      const comparison = compareHands(playerHand.handrank, winningHands[0].handrank)
      if (comparison > 0) {
        winningHands = [playerHand]
      } else if (comparison === 0) {
        if (!winningHands.some(hand => hand.index === playerHand.index)) {
          winningHands.push(playerHand)
        }
      }
    }
  }
  return winningHands.map(hand => hand.index)
}

let winnerIndex = ref<number[]>([])

watch(() => table.value?.communityCards.length, (newVal) => {
  if (newVal === 5) {
    let hands = table.value?.holeCards.map(card => card?.join(''))
    let board = table.value?.communityCards.join('')
    winnerIndex.value = checkWin(hands, board)
  } else {
    winnerIndex.value = []
  }
})

const isWinner = computed(() => {
  return playerIndex => {
    if (!winnerIndex.value.length) return false
    return !winnerIndex.value.includes(playerIndex)
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
              'opacity-40': isWinner(index - 1)
            }"
          >
            <template v-if="index === 1">
              <div class="absolute top-0 right-0 z-10 leading-[0]">
                <button
                  class="bg-blue-500 text-white p-1 text-xs rounded-tr-lg rounded-bl-lg"
                  @click="getStrategyPrepare"
                >
                  {{ isPendingMutation ? 'Wait' : 'Ask AI' }}
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
