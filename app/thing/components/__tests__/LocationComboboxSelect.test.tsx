import { describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import LocationComboboxSelect from '../LocationComboboxSelect'

// Mock useLocationData
const mockAreas: any[] = []
const mockRooms: any[] = []
const mockSpots: any[] = []
const mockLoading = false
const mockSetAreas = vi.fn()
const mockSetRooms = vi.fn()
const mockSetSpots = vi.fn()
const mockLoadAreas = vi.fn()
const mockLoadRooms = vi.fn()
const mockLoadSpots = vi.fn()
const mockUseLocationData = vi.fn(() => ({
  areas: mockAreas,
  rooms: mockRooms,
  spots: mockSpots,
  loading: mockLoading,
  setAreas: mockSetAreas,
  setRooms: mockSetRooms,
  setSpots: mockSetSpots,
  loadAreas: mockLoadAreas,
  loadRooms: mockLoadRooms,
  loadSpots: mockLoadSpots,
}))

vi.mock('@/hooks/useLocationData', () => ({
  useLocationData: () => mockUseLocationData(),
}))

vi.mock('@/components/ui/combobox', () => ({
  Combobox: ({
    options,
    value,
    onChange,
    onCreateOption,
    placeholder,
    emptyText,
    createText,
    searchText,
  }: any) => (
    <div data-testid="combobox">
      <span data-placeholder={placeholder}>{placeholder}</span>
      <span data-empty={emptyText}>{emptyText}</span>
      <span data-create={createText}>{createText}</span>
      {options?.map((opt: any) => (
        <button key={opt.value} onClick={() => onChange?.(opt.value)}>
          {opt.label}
        </button>
      ))}
      <button data-testid="create-opt" onClick={() => onCreateOption?.('New')}>
        Create
      </button>
    </div>
  ),
}))

describe('LocationComboboxSelect', () => {
  beforeEach(() => {
    mockAreas.length = 0
    mockRooms.length = 0
    mockSpots.length = 0
    mockLoadAreas.mockClear()
    mockLoadRooms.mockClear()
    mockLoadSpots.mockClear()
    mockUseLocationData.mockReturnValue({
      areas: mockAreas,
      rooms: mockRooms,
      spots: mockSpots,
      loading: mockLoading,
      setAreas: mockSetAreas,
      setRooms: mockSetRooms,
      setSpots: mockSetSpots,
      loadAreas: mockLoadAreas,
      loadRooms: mockLoadRooms,
      loadSpots: mockLoadSpots,
    })
  })

  it('renders area combobox', () => {
    render(<LocationComboboxSelect onSelect={vi.fn()} />)
    expect(screen.getByTestId('combobox')).toBeDefined()
  })

  it('calls loadAreas on mount', () => {
    render(<LocationComboboxSelect onSelect={vi.fn()} />)
    expect(mockLoadAreas).toHaveBeenCalled()
  })

  it('shows loading indicator', () => {
    mockUseLocationData.mockReturnValueOnce({
      areas: [],
      rooms: [],
      spots: [],
      loading: true,
      setAreas: mockSetAreas,
      setRooms: mockSetRooms,
      setSpots: mockSetSpots,
      loadAreas: mockLoadAreas,
      loadRooms: mockLoadRooms,
      loadSpots: mockLoadSpots,
    })
    render(<LocationComboboxSelect onSelect={vi.fn()} />)
    expect(screen.getByText('加载中...')).toBeDefined()
  })
})
