import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { PreferenceFeedbackDialog } from './preference-feedback-dialog'

describe('PreferenceFeedbackDialog', () => {
  it('submits a category and note', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined)
    const user = userEvent.setup()

    render(
      <PreferenceFeedbackDialog
        open={true}
        onClose={() => {}}
        onSubmit={onSubmit}
      />
    )

    await user.click(screen.getByLabelText('人物不对味'))
    await user.type(screen.getByLabelText('具体偏差'), '主角说话太轻浮')
    await user.click(screen.getByRole('button', { name: '记录偏差' }))

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        category: 'character',
        note: '主角说话太轻浮',
      })
    })
  })
})
