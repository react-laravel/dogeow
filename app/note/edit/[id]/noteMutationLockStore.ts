const inFlightNoteMutations = new Map<string, number>()
const inFlightNoteMutationListeners = new Set<() => void>()

function notifyInFlightNoteMutationListeners() {
  inFlightNoteMutationListeners.forEach(listener => {
    listener()
  })
}

export function addInFlightNoteMutation(noteId: string) {
  inFlightNoteMutations.set(noteId, (inFlightNoteMutations.get(noteId) ?? 0) + 1)
  notifyInFlightNoteMutationListeners()
}

export function removeInFlightNoteMutation(noteId: string) {
  const currentCount = inFlightNoteMutations.get(noteId)
  if (!currentCount) {
    return
  }

  if (currentCount === 1) {
    inFlightNoteMutations.delete(noteId)
  } else {
    inFlightNoteMutations.set(noteId, currentCount - 1)
  }

  notifyInFlightNoteMutationListeners()
}

export function hasInFlightNoteMutation(noteId: string) {
  return (inFlightNoteMutations.get(noteId) ?? 0) > 0
}

export function subscribeToInFlightNoteMutations(listener: () => void) {
  inFlightNoteMutationListeners.add(listener)

  return () => {
    inFlightNoteMutationListeners.delete(listener)
  }
}

export function resetInFlightNoteMutationsForTests() {
  inFlightNoteMutations.clear()
  notifyInFlightNoteMutationListeners()
}
