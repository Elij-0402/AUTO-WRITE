import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ProjectCharterForm } from './project-charter-form'

const emptyCharter = {
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
}

describe('ProjectCharterForm', () => {
  it('submits normalized arrays and saves the charter', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined)
    const user = userEvent.setup()

    render(
      <ProjectCharterForm
        initialValue={emptyCharter}
        onSave={onSave}
      />
    )

    await user.type(screen.getByLabelText('一句话设定'), '流亡太子重返帝京')
    await user.type(screen.getByLabelText('作品承诺'), '权谋与复国并行')
    await user.type(screen.getByLabelText('主题'), '复国, 忠诚')
    await user.click(screen.getByRole('button', { name: '保存这版方向' }))

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

  it('does not wipe unsaved edits when rerendered with a new object of the same values', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn().mockResolvedValue(undefined)
    const { rerender } = render(
      <ProjectCharterForm
        initialValue={emptyCharter}
        onSave={onSave}
      />
    )

    await user.type(screen.getByLabelText('一句话设定'), '还没保存的设定')

    rerender(
      <ProjectCharterForm
        initialValue={{ ...emptyCharter }}
        onSave={onSave}
      />
    )

    expect(screen.getByLabelText('一句话设定')).toHaveValue('还没保存的设定')
  })

  it('keeps unsaved values when accordion sections are toggled', async () => {
    const user = userEvent.setup()

    render(
      <ProjectCharterForm
        initialValue={emptyCharter}
        onSave={vi.fn().mockResolvedValue(undefined)}
      />
    )

    await user.click(screen.getByRole('button', { name: /再补写法边界/i }))
    const toneInput = screen.getByLabelText('语气')
    await user.type(toneInput, '冷峻克制')

    await user.click(screen.getByRole('button', { name: /再补写法边界/i }))
    await user.click(screen.getByRole('button', { name: /再补写法边界/i }))

    expect(screen.getByLabelText('语气')).toHaveValue('冷峻克制')
  })

  it('renders ai understanding as collapsed read-only feedback', async () => {
    const user = userEvent.setup()

    render(
      <ProjectCharterForm
        initialValue={{
          ...emptyCharter,
          aiUnderstanding: '故事核心：流亡太子重返帝京\n整体语气：冷峻克制',
        }}
        onSave={vi.fn().mockResolvedValue(undefined)}
      />
    )

    expect(screen.queryByDisplayValue(/故事核心：流亡太子重返帝京/)).not.toBeInTheDocument()
    expect(screen.getByText('已同步')).toBeInTheDocument()
    expect(screen.getByText('故事核心：流亡太子重返帝京')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /AI 当前理解/i }))

    expect(screen.getByText(/整体语气：冷峻克制/)).toBeInTheDocument()
  })

  it('shows an empty feedback hint when ai understanding is unavailable', () => {
    render(
      <ProjectCharterForm
        initialValue={emptyCharter}
        onSave={vi.fn().mockResolvedValue(undefined)}
      />
    )

    expect(screen.getByText('暂无内容')).toBeInTheDocument()
    expect(screen.getByText('保存后，AI 会根据你的宪章生成理解摘要。')).toBeInTheDocument()
  })
})
