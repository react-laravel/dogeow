// Adapted for Tiptap 3 from Novel 1.x (Apache-2.0); see NOTICE.md.
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { Decoration, DecorationSet, type EditorView } from '@tiptap/pm/view'

const uploadKey = new PluginKey<DecorationSet>('image-upload')
export function UploadImagesPlugin({ imageClass = '' }: { imageClass?: string } = {}) {
  return new Plugin<DecorationSet>({
    key: uploadKey,
    state: {
      init: () => DecorationSet.empty,
      apply(tr, previous) {
        let decorations = previous.map(tr.mapping, tr.doc)
        const action = tr.getMeta(uploadKey) as
          | { add?: { id: object; pos: number; src: string }; remove?: { id: object } }
          | undefined
        if (action?.add) {
          const { id, pos, src } = action.add
          const image = document.createElement('img')
          image.src = src
          image.className = imageClass
          image.alt = '图片上传中'
          decorations = decorations.add(tr.doc, [Decoration.widget(pos, image, { id })])
        }
        if (action?.remove)
          decorations = decorations.remove(
            decorations.find(undefined, undefined, spec => spec.id === action.remove?.id)
          )
        return decorations
      },
    },
    props: {
      decorations(state) {
        return this.getState(state)
      },
    },
  })
}

export function createImageUpload({
  onUpload,
  validateFn,
}: {
  onUpload: (file: File) => Promise<string>
  validateFn?: (file: File) => boolean
}) {
  return (file: File, view: EditorView, pos: number) => {
    if (validateFn && !validateFn(file)) return
    const id = {}
    const preview = URL.createObjectURL(file)
    const tr = view.state.tr
    if (!tr.selection.empty) tr.deleteSelection()
    const position = Math.max(0, Math.min(tr.mapping.map(pos), tr.doc.content.size))
    view.dispatch(tr.setMeta(uploadKey, { add: { id, pos: position, src: preview } }))
    void Promise.resolve()
      .then(() => onUpload(file))
      .then(url => {
        if (view.isDestroyed) return
        const location = uploadKey
          .getState(view.state)
          ?.find(undefined, undefined, spec => spec.id === id)[0]?.from
        if (location === undefined) return
        const resolved = new URL(url, window.location.origin)
        if (!['http:', 'https:'].includes(resolved.protocol)) throw new Error('不支持的图片地址')
        const image = view.state.schema.nodes.image.create({ src: resolved.href })
        view.dispatch(
          view.state.tr
            .replaceWith(location, location, image)
            .setMeta(uploadKey, { remove: { id } })
        )
      })
      .catch(() => {
        if (!view.isDestroyed) view.dispatch(view.state.tr.setMeta(uploadKey, { remove: { id } }))
      })
      .finally(() => URL.revokeObjectURL(preview))
  }
}

type UploadHandler = ReturnType<typeof createImageUpload>
export function handleImagePaste(
  view: EditorView,
  event: ClipboardEvent,
  upload: UploadHandler
): boolean {
  const image = Array.from(event.clipboardData?.files ?? []).find(file =>
    file.type.startsWith('image/')
  )
  if (!image) return false
  event.preventDefault()
  upload(image, view, view.state.selection.from)
  return true
}
export function handleImageDrop(
  view: EditorView,
  event: DragEvent,
  moved: boolean,
  upload: UploadHandler
): boolean {
  const image = Array.from(event.dataTransfer?.files ?? []).find(file =>
    file.type.startsWith('image/')
  )
  if (moved || !image) return false
  event.preventDefault()
  upload(
    image,
    view,
    view.posAtCoords({ left: event.clientX, top: event.clientY })?.pos ?? view.state.selection.from
  )
  return true
}
