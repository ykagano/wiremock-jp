export interface Mapping {
  id?: string
  uuid?: string
  name?: string
  request: MappingRequest
  response: MappingResponse
  priority?: number
  scenarioName?: string
  requiredScenarioState?: string
  newScenarioState?: string
  persistent?: boolean
  metadata?: {
    'wiremock-gui'?: {
      folder?: string
    }
  }
}

export interface MappingRequest {
  method?: string
  url?: string
  urlPattern?: string
  urlPath?: string
  urlPathPattern?: string
  headers?: Record<string, unknown>
  queryParameters?: Record<string, unknown>
  cookies?: Record<string, unknown>
  bodyPatterns?: BodyPattern[]
}

export interface MappingResponse {
  status: number
  statusMessage?: string
  body?: string
  jsonBody?: unknown
  bodyFileName?: string
  headers?: Record<string, string>
  additionalProxyRequestHeaders?: Record<string, string>
  fixedDelayMilliseconds?: number
  delayDistribution?: unknown
  transformers?: string[]
  fromConfiguredStub?: boolean
}

export interface BodyPattern {
  equalTo?: string
  contains?: string
  matches?: string
  doesNotMatch?: string
  equalToJson?: string
  matchesJsonPath?: string
  equalToXml?: string
  matchesXPath?: string
  binaryEqualTo?: string
}

export interface LoggedRequest {
  id: string
  request: {
    url: string
    absoluteUrl: string
    method: string
    clientIp?: string
    headers: Record<string, unknown>
    cookies?: Record<string, unknown>
    body?: string
    bodyAsBase64?: string
    loggedDate: number
    loggedDateString: string
  }
  responseDefinition?: {
    status: number
    body?: string
    headers?: Record<string, string>
  }
  wasMatched: boolean
  stubMapping?: Mapping
}

export interface MappingsResponse {
  mappings: Mapping[]
  meta?: {
    total: number
  }
}

export interface RequestsResponse {
  requests: LoggedRequest[]
  meta?: {
    total: number
  }
}
