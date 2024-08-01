<script setup lang="ts">
import { useQuery } from '@tanstack/vue-query'
import LoadingIndicator from './components/LoadingIndicator.vue'
import { getTables } from './api'

import { RouterLink, RouterView, useRouter } from 'vue-router'
import UploadFile from '@/components/UploadFile.vue'

const { data: tables, isPending, refetch } = useQuery({
  queryKey: ['tables'],
  queryFn: getTables,
  refetchInterval: 5000,
  throwOnError: true
})

const router = useRouter()

const tableCreated = (id) => {
  refetch()
  router.push({ params: { id }})
}

</script>

<template>
  <div class="flex h-screen bg-gray-100">
    <div class="hidden md:flex flex-col w-64 bg-gray-800 p-2">
      <LoadingIndicator v-if="isPending" class="ml-auto mr-auto pt-4" />
      <template v-else>
        <ul class="list-none text-white text-xl pb-4">
          <li v-for="table in tables" :key="table.id">
            <RouterLink
              :to="{ name: 'table', params: { id: table.id } }"
              class="p-2"
              active-class="font-bold underline"
            >
              {{ table.name }}
            </RouterLink>
          </li>
        </ul>
        <UploadFile
          @tableCreated="tableCreated"
        />
      </template>
    </div>
    <div class="p-4 w-full">
      <RouterView />
    </div>
  </div>
</template>
