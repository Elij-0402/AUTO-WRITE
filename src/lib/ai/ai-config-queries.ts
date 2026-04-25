/**
 * AI config queries — retrieves the global AI config from meta-db.
 * Note: AI config is stored globally (not per-project) since v2.
 */

import type { AIClientConfig } from './providers/types'
import type { GlobalAIConfig } from '../db/meta-db'
import { metaDb } from '../db/meta-db'

const DEFAULT_CONFIG: AIClientConfig = {
  provider: 'anthropic',
  apiKey: '',
  baseUrl: '',
  model: 'claude-sonnet-4-5',
}

/**
 * Get the global AI config for a project.
 * Note: projectId is accepted for API compatibility but AI config is global.
 * Returns AIClientConfig ready for use with streamChat().
 */
export async function getProjectAIConfig(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _projectId: string
): Promise<AIClientConfig> {
  const globalConfig = await metaDb.aiConfig.get('config') as GlobalAIConfig | undefined

  if (!globalConfig) {
    return DEFAULT_CONFIG
  }

  return {
    provider: globalConfig.provider ?? 'anthropic',
    apiKey: globalConfig.apiKey ?? '',
    baseUrl: globalConfig.baseUrl ?? '',
    model: globalConfig.model,
  }
}
