'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { useItemStore } from '@/app/thing/stores/itemStore'
import { useAutoSave } from '@/hooks/useAutoSave'
import { ItemFormData, UploadedImage, LocationSelection, Room, Spot, Tag } from '@/app/thing/types'
import { INITIAL_FORM_DATA, AUTO_SAVE_DELAY } from '../constants'
import {
  convertImagesToUploadedFormat,
  buildLocationPath,
  tagsToIdStrings,
  hasDataChanged,
} from '../utils/dataTransform'
import { useAreas, useRooms, useSpots } from '../services/api'
import { apiRequest } from '@/lib/api'
import { logger } from '@/lib/logger'

interface UseItemDetailEditProps {
  itemId: number | null
  item: any
  mode: 'view' | 'edit'
  open: boolean
}

interface AutoSaveData {
  formData: ItemFormData
  selectedTags: string[]
  uploadedImages: UploadedImage[]
}

export function useItemDetailEdit({ itemId, item, mode, open }: UseItemDetailEditProps) {
  // Edit mode state
  const [editLoading, setEditLoading] = useState(false)
  const [formData, setFormData] = useState<ItemFormData>(INITIAL_FORM_DATA)
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([])
  const [selectedLocation, setSelectedLocation] = useState<LocationSelection>(undefined)
  const [locationPath, setLocationPath] = useState<string>('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [createTagDialogOpen, setCreateTagDialogOpen] = useState(false)
  const [quantityDialogOpen, setQuantityDialogOpen] = useState(false)
  const [tempQuantity, setTempQuantity] = useState(1)

  const editInitializedRef = useRef<number | null>(null)
  const itemRef = useRef(item)
  const initialDataRef = useRef<AutoSaveData | null>(null)
  const formDataRef = useRef(formData)
  const selectedTagsRef = useRef(selectedTags)
  const uploadedImagesRef = useRef(uploadedImages)

  const { categories, tags, fetchCategories, fetchTags, updateItem } = useItemStore()
  const { mutate: refreshAreas } = useAreas()
  const { data: rooms = [], mutate: refreshRooms } = useRooms<Room[]>()
  const { data: spots = [], mutate: refreshSpots } = useSpots<Spot[]>()

  const refreshAreasRef = useRef(refreshAreas)
  useEffect(() => {
    refreshAreasRef.current = refreshAreas
  }, [refreshAreas])

  useEffect(() => {
    itemRef.current = item
  }, [item])

  // Update refs on state changes
  useEffect(() => {
    formDataRef.current = formData
    selectedTagsRef.current = selectedTags
    uploadedImagesRef.current = uploadedImages
  }, [formData, selectedTags, uploadedImages])

  // Auto-save handler
  const handleAutoSave = useCallback(
    async (_data: AutoSaveData) => {
      if (!itemId || !item || mode !== 'edit' || !open) return
      if (!formData.name || !formData.name.trim()) return

      const updateData: Parameters<typeof updateItem>[1] = {
        ...formData,
        purchase_date: formData.purchase_date ?? null,
        expiry_date: formData.expiry_date ?? null,
        purchase_price: formData.purchase_price ? Number(formData.purchase_price) : null,
        category_id: formData.category_id ? String(formData.category_id) : '',
        area_id: formData.area_id ? String(formData.area_id) : '',
        room_id: formData.room_id ? String(formData.room_id) : '',
        spot_id: formData.spot_id ? String(formData.spot_id) : '',
        image_ids: uploadedImages
          .filter(img => img.id)
          .map(img => img.id!)
          .filter((id): id is number => id !== undefined),
        image_paths: uploadedImages.filter(img => !img.id).map(img => img.path),
        tags: selectedTags.map(id => Number(id)).filter(id => Number.isFinite(id)),
      }
      const updatedItem = await updateItem(itemId, updateData)
      const { mutate } = await import('swr')
      await mutate(`/things/items/${itemId}`, updatedItem, false)
    },
    [formData, uploadedImages, selectedTags, updateItem, itemId, item, mode, open]
  )

  const { autoSaving, lastSaved, triggerAutoSave, setInitialData, cancelAutoSave } =
    useAutoSave<AutoSaveData>({
      onSave: handleAutoSave,
      delay: AUTO_SAVE_DELAY,
    })

  // Location handlers
  const loadRooms = useCallback(
    async (areaId: string | number) => {
      if (!areaId) return
      try {
        await apiRequest<Room[]>(`/areas/${areaId}/rooms`)
        refreshRooms()
      } catch (error) {
        logger.error('加载房间失败', error)
      }
    },
    [refreshRooms]
  )

  const loadSpots = useCallback(
    async (roomId: string | number) => {
      if (!roomId) return
      try {
        await apiRequest<Spot[]>(`/rooms/${roomId}/spots`)
        refreshSpots()
      } catch (error) {
        logger.error('加载位置失败', error)
      }
    },
    [refreshSpots]
  )

  const handleLocationSelect = useCallback(
    (type: 'area' | 'room' | 'spot', id: number, fullPath?: string) => {
      setSelectedLocation({ type, id })
      setLocationPath(fullPath ?? '')

      const updates: Partial<ItemFormData> = {}

      if (type === 'area') {
        updates.area_id = id.toString()
        updates.room_id = ''
        updates.spot_id = ''
      } else if (type === 'room') {
        updates.room_id = id.toString()
        updates.spot_id = ''
        const room = rooms.find(r => r.id === id)
        if (room?.area_id) {
          updates.area_id = room.area_id.toString()
        }
      } else if (type === 'spot') {
        updates.spot_id = id.toString()
        const spot = spots.find(s => s.id === id)
        if (spot?.room_id) {
          updates.room_id = spot.room_id.toString()
          const room = rooms.find(r => r.id === spot.room_id)
          if (room?.area_id) {
            updates.area_id = room.area_id.toString()
          }
        }
      }

      setFormData(prev => ({ ...prev, ...updates }))
    },
    [rooms, spots]
  )

  // Tag handler
  const handleTagCreated = useCallback(
    (tag: Tag) => {
      fetchTags()
      setSelectedTags(prev => [...prev, tag.id.toString()])
    },
    [fetchTags]
  )

  // Initialize edit data
  const initializeEditData = useCallback(async () => {
    const currentItem = itemRef.current
    if (!itemId || !currentItem) return
    if (editInitializedRef.current === itemId) return

    setEditLoading(true)
    editInitializedRef.current = itemId
    try {
      const itemFormData: ItemFormData = {
        name: currentItem.name,
        description: currentItem.description ?? '',
        quantity: currentItem.quantity,
        status: currentItem.status,
        purchase_date: currentItem.purchase_date ? new Date(currentItem.purchase_date) : null,
        expiry_date: currentItem.expiry_date ? new Date(currentItem.expiry_date) : null,
        purchase_price: currentItem.purchase_price ?? null,
        category_id: currentItem.category_id?.toString() ?? '',
        area_id: currentItem.spot?.room?.area?.id?.toString() ?? '',
        room_id: currentItem.spot?.room?.id?.toString() ?? '',
        spot_id: currentItem.spot_id?.toString() ?? '',
        is_public: currentItem.is_public,
      }

      setFormData(itemFormData)

      if (currentItem.images && currentItem.images.length > 0) {
        setUploadedImages(convertImagesToUploadedFormat(currentItem.images))
      }

      await Promise.all([fetchCategories(), fetchTags()])

      if (currentItem.spot?.room?.area?.id) {
        await loadRooms(currentItem.spot.room.area.id)
      }

      if (currentItem.spot?.room?.id) {
        await loadSpots(currentItem.spot.room.id)
      }

      if (currentItem.spot_id) {
        setSelectedLocation({ type: 'spot', id: currentItem.spot_id })
        setLocationPath(
          buildLocationPath(
            currentItem.spot?.room?.area?.name,
            currentItem.spot?.room?.name,
            currentItem.spot?.name
          )
        )
      } else if (currentItem.room_id) {
        setSelectedLocation({ type: 'room', id: currentItem.room_id })
        setLocationPath(
          buildLocationPath(currentItem.spot?.room?.area?.name, currentItem.spot?.room?.name)
        )
      } else if (currentItem.area_id) {
        setSelectedLocation({ type: 'area', id: currentItem.area_id })
        setLocationPath(buildLocationPath(currentItem.spot?.room?.area?.name))
      }

      if (currentItem.tags?.length) {
        setSelectedTags(tagsToIdStrings(currentItem.tags))
      }

      const initialData: AutoSaveData = {
        formData: itemFormData,
        selectedTags: currentItem.tags ? tagsToIdStrings(currentItem.tags) : [],
        uploadedImages: currentItem.images ? convertImagesToUploadedFormat(currentItem.images) : [],
      }
      setInitialData(initialData)
    } catch (error) {
      logger.error('初始化编辑数据失败', error)
      toast.error('加载编辑数据失败')
    } finally {
      setEditLoading(false)
    }
  }, [itemId, fetchCategories, fetchTags, loadRooms, loadSpots, setInitialData])

  // Auto-save effect
  useEffect(() => {
    if (mode !== 'edit' || editLoading || !item || !open) return

    const currentData: AutoSaveData = {
      formData,
      selectedTags,
      uploadedImages,
    }

    if (!initialDataRef.current) {
      initialDataRef.current = currentData
      return
    }

    const hasChanges = hasDataChanged(currentData, initialDataRef.current)
    if (hasChanges) {
      triggerAutoSave()
      initialDataRef.current = currentData
    }
  }, [formData, selectedTags, uploadedImages, mode, editLoading, item, open, triggerAutoSave])

  // Initialize data effect
  useEffect(() => {
    if (mode === 'edit' && !editLoading && item && formData.name) {
      const currentData: AutoSaveData = {
        formData: formDataRef.current,
        selectedTags: selectedTagsRef.current,
        uploadedImages: uploadedImagesRef.current,
      }
      if (!initialDataRef.current) {
        initialDataRef.current = currentData
      }
    }
  }, [mode, editLoading, item, formData.name])

  // Area change effect
  useEffect(() => {
    if (mode !== 'edit' || !formData.area_id) {
      if (mode === 'edit') {
        setFormData(prev => ({ ...prev, room_id: '', spot_id: '' }))
      }
      return
    }
    loadRooms(formData.area_id)
  }, [formData.area_id, loadRooms, mode])

  // Room change effect
  useEffect(() => {
    if (mode !== 'edit' || !formData.room_id) {
      if (mode === 'edit') {
        setFormData(prev => ({ ...prev, spot_id: '' }))
      }
      return
    }
    loadSpots(formData.room_id)
  }, [formData.room_id, loadSpots, mode])

  // Initialization effect
  useEffect(() => {
    if (
      mode === 'edit' &&
      item &&
      !editLoading &&
      itemId &&
      editInitializedRef.current !== itemId
    ) {
      initializeEditData()
      refreshAreasRef.current()
    }
  }, [mode, item, editLoading, itemId, initializeEditData])

  // Reset on itemId change
  useEffect(() => {
    if (itemId && editInitializedRef.current !== itemId) {
      if (editInitializedRef.current !== null) {
        editInitializedRef.current = null
      }
    }
  }, [itemId])

  // Reset on modal close
  useEffect(() => {
    if (!open) {
      cancelAutoSave()
      setEditLoading(false)
      setFormData(INITIAL_FORM_DATA)
      setUploadedImages([])
      setSelectedTags([])
      setSelectedLocation(undefined)
      setLocationPath('')
      setInitialData({
        formData: INITIAL_FORM_DATA,
        selectedTags: [],
        uploadedImages: [],
      })
      editInitializedRef.current = null
    }
  }, [open, cancelAutoSave, setInitialData])

  // Quantity handlers
  const handleQuantityClick = useCallback(() => {
    setTempQuantity(formData.quantity || 1)
    setQuantityDialogOpen(true)
  }, [formData.quantity])

  const handleQuantityConfirm = useCallback(() => {
    setFormData(prev => ({
      ...prev,
      quantity: tempQuantity || 1,
    }))
    setQuantityDialogOpen(false)
  }, [tempQuantity])

  const handleCategorySelect = useCallback((_type: 'parent' | 'child', id: number | null) => {
    setFormData(prev => ({
      ...prev,
      category_id: id ? String(id) : '',
    }))
  }, [])

  return {
    // State
    editLoading,
    formData,
    setFormData,
    uploadedImages,
    setUploadedImages,
    selectedLocation,
    setSelectedLocation,
    locationPath,
    selectedTags,
    setSelectedTags,
    createTagDialogOpen,
    setCreateTagDialogOpen,
    quantityDialogOpen,
    setQuantityDialogOpen,
    tempQuantity,
    setTempQuantity,
    rooms,
    spots,
    // Auto-save
    autoSaving,
    lastSaved,
    // Handlers
    handleLocationSelect,
    handleTagCreated,
    handleQuantityClick,
    handleQuantityConfirm,
    handleCategorySelect,
    loadRooms,
    loadSpots,
  }
}
