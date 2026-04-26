import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ProjectCharterForm } from './project-charter-form'

describe('ProjectCharterForm', () => {
  it('submits normalized arrays and saves the charter', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined)
    const user = userEvent.setup()

    render(
      <ProjectCharterForm
        initialValue={{
          oneLinePremise: '',
          storyPromise: '',
          themes: [],
          tone: '',
          targetReader: '',
          styleDos: [],
          tabooList: [],
          positiveReferences: [],
          negativeReferences: [],
          aiUnderstanding: '',
        }}
        onSave={onSave}
      />
    )

    await user.type(screen.getByLabelText('一句话设定'), '流亡太子重返帝京')
    await user.type(screen.getByLabelText('作品承诺'), '权谋与复国并行')
    await user.type(screen.getByLabelText('主题'), '复国, 忠诚')
    await user.click(screen.getByRole('button', { name: '保存宪章' }))

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith(
        expect.objectContaining({
          oneLinePremise: '流亡太子重返帝京',
          storyPromise: '权谋与复国并行',
          themes: ['复国', '忠诚'],
        })
      )
    })
  })
})
