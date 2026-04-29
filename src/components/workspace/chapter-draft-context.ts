import type { ChapterPlan, SceneCard } from '@/lib/types'

export function buildDraftOutlineFromPlanning(
  chapterPlan: ChapterPlan,
  sceneCards: SceneCard[]
): string {
  const parts = [
    '【章节定位】',
    `章节标题：${chapterPlan.title}`,
    `章节摘要：${chapterPlan.summary || '待补充'}`,
    `章节目标：${chapterPlan.chapterGoal || '待补充'}`,
    `核心冲突：${chapterPlan.conflict || '待补充'}`,
    `转折：${chapterPlan.turn || '待补充'}`,
    `揭示：${chapterPlan.reveal || '待补充'}`,
  ]

  const orderedScenes = [...sceneCards].sort((a, b) => a.order - b.order)
  if (orderedScenes.length === 0) {
    return parts.join('\n')
  }

  parts.push('', '【场景拆解】')
  for (const scene of orderedScenes) {
    parts.push(
      `${scene.order}. ${scene.title}`,
      `视角：${scene.viewpoint || '待补充'}`,
      `地点：${scene.location || '待补充'}`,
      `目标：${scene.objective || '待补充'}`,
      `阻碍：${scene.obstacle || '待补充'}`,
      `结果：${scene.outcome || '待补充'}`,
      `连续性提醒：${scene.continuityNotes || '待补充'}`,
      ''
    )
  }

  return parts.join('\n').trim()
}

export function buildDraftGenerationSourceSummary(
  chapterPlan: ChapterPlan,
  sceneCards: SceneCard[]
): string {
  const parts = [
    `来源章纲：${chapterPlan.title}`,
    sceneCards.length > 0
      ? `场景拆解：${sceneCards.length} 张场景卡`
      : '场景拆解：尚未补齐',
  ]

  if (chapterPlan.targetWordCount) {
    parts.push(`目标字数：${chapterPlan.targetWordCount} 字`)
  }

  return parts.join(' · ')
}

export function normalizeDraftForInsertion(draft: string): string {
  return draft
    .replace(/\r\n/g, '\n')
    .trim()
}
