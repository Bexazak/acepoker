import { z } from 'zod'

const tableSchema = z.object({
  id: z.number(),
  name: z.string(),
  capacity: z.number(),
  holeCards: z.array(z.union([z.array(z.string()), z.null()])),
  communityCards: z.array(z.string())
})

const tableInfoSchema = tableSchema.pick({
  id: true,
  name: true
})

const strategyInfoSchema = z.object({
  format: z.string(),
  state: z.string() || z.undefined()
})

const strategySchema = z.object({
  f: z.number(),
  c: z.number(),
  r1000: z.number(),
  r497: z.number(),
  r625: z.number(),
  r812: z.number(),
  r450: z.number()
})


type Table = z.infer<typeof tableSchema>
type TableInfo = z.infer<typeof tableInfoSchema>
export type StrategyInfo = z.infer<typeof strategyInfoSchema>
type Strategy = z.infer<typeof strategySchema>

export function getTables(): Promise<TableInfo[]> {
  return fetch('/api/tables')
    .then((r) => r.json())
    .then((data) => z.array(tableInfoSchema).parse(data))
}

export function getTable(id: number): Promise<Table> {
  return fetch(`/api/tables/${id}`)
    .then((r) => r.json())
    .then((data) => tableSchema.parse(data))
}

export function getStrategy(data: string){
  return fetch(`/act`, {
    method: 'POST',
    headers: {
      'Authorization': 'dc929e5e5e6d83784baa294a1819dfe1'
    },
    body: data
  })
    .then((r) => r.json())
    .then((data) => strategySchema.parse(data))
    .catch(error => {
      alert('Unable to assist you')
      console.error('Error:', error)
    });
}

export function createTable(input: Omit<Table, 'id'>): Promise<Table> {
  return fetch('/api/tables', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(input)
  })
    .then((r) => r.json())
    .then((data) => tableSchema.parse(data))
}
