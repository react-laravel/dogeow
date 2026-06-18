import { create } from 'zustand'

interface AiDialogStore {
  externalOpen: boolean
  seedPrompt: string | null
  requestOpen: (seedPrompt?: string) => void
  requestClose: () => void
  consumeSeedPrompt: () => string | null
  setExternalOpen: (open: boolean) => void
}

export const useAiDialogStore = create<AiDialogStore>((set, get) => ({
  externalOpen: false,
  seedPrompt: null,
  requestOpen: seedPrompt =>
    set({
      externalOpen: true,
      seedPrompt: seedPrompt?.trim() ? seedPrompt.trim() : null,
    }),
  requestClose: () => set({ externalOpen: false, seedPrompt: null }),
  consumeSeedPrompt: () => {
    const prompt = get().seedPrompt
    set({ seedPrompt: null })
    return prompt
  },
  setExternalOpen: open => {
    if (!open) {
      set({ externalOpen: false, seedPrompt: null })
      return
    }
    set({ externalOpen: true })
  },
}))
