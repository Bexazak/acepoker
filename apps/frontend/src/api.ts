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
  state: z.string()
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

const mockStrategy: Strategy = {
  "f": 0.000017974361981032416,
  "c": 0.14158734679222107,
  "r1000": 0.19790553617849582,
  "r497": 0.5892510414123535,
  "r625": 0.0685708224773407,
  "r812": 0.0026672857347875834,
  "r450": 0
}

export function getStrategy(data: StrategyInfo): Promise<Strategy> {
  return fetch(`/act`, {
    method: 'POST',
    headers: {
      'Authorization': 'dc929e5e5e6d83784baa294a1819dfe1'
    },
    body: JSON.stringify(data)
  })
    .then((r) => r.json())
    // TODO: повертаю замокані дані, бо з API бота приходить помилка, говорить, що format невірний
    // .then((data) => strategySchema.parse(data))
    .then(() => mockStrategy)
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
