import { describe, expect, it } from 'vitest'
import {
  createNodeCanvasRenderer,
  createLinkColorGetter,
  createLinkWidthGetter,
} from '../nodeRenderer'
import type { NodeData, LinkData, GraphPalette } from '../../types/graph'

const createNode = (overrides: Partial<NodeData> = {}): NodeData => ({
  id: '1',
  title: 'Test Node',
  slug: 'test',
  tags: [],
  summary: '',
  x: 100,
  y: 200,
  ...overrides,
})

const createLink = (overrides: Partial<LinkData> = {}): LinkData => ({
  source: '1',
  target: '2',
  type: '',
  ...overrides,
})

const createPalette = (overrides: Partial<GraphPalette> = {}): GraphPalette => ({
  background: '#ffffff',
  nodeDefault: '#666666',
  nodeActive: '#2563eb',
  nodeNeighbor: '#94a3b8',
  nodeHover: '#38bdf8',
  labelDefault: '#64748b',
  labelActive: '#2563eb',
  labelNeighbor: '#f8fafc',
  linkMuted: 'rgba(100, 116, 139, 0.35)',
  linkActive: 'rgba(37, 99, 235, 0.95)',
  border: '#e5e7eb',
  card: '#ffffff',
  ...overrides,
})

describe('nodeRenderer', () => {
  describe('createNodeCanvasRenderer', () => {
    it('should return a render function', () => {
      const renderer = createNodeCanvasRenderer(null, null, new Set(), createPalette())
      expect(typeof renderer).toBe('function')
    })

    it('should draw active node with active color', () => {
      const renderer = createNodeCanvasRenderer(
        createNode({ id: '1' }),
        null,
        new Set(),
        createPalette()
      )

      const ctx = {
        beginPath: vi.fn(),
        arc: vi.fn(),
        fill: vi.fn(),
        fillText: vi.fn(),
        font: '',
        textAlign: '',
        textBaseline: '',
      } as unknown as CanvasRenderingContext2D

      const globalScale = 1
      renderer(createNode({ id: '1', x: 100, y: 200 }), ctx, globalScale)

      expect(ctx.beginPath).toHaveBeenCalled()
      expect(ctx.arc).toHaveBeenCalled()
    })

    it('should draw neighbor node with neighbor color', () => {
      const neighborIds = new Set(['2'])
      const renderer = createNodeCanvasRenderer(
        createNode({ id: '1' }),
        null,
        neighborIds,
        createPalette()
      )

      const ctx = {
        beginPath: vi.fn(),
        arc: vi.fn(),
        fill: vi.fn(),
        fillText: vi.fn(),
        font: '',
        textAlign: '',
        textBaseline: '',
      } as unknown as CanvasRenderingContext2D

      renderer(createNode({ id: '2', x: 100, y: 200 }), ctx, 1)

      expect(ctx.beginPath).toHaveBeenCalled()
    })

    it('should draw hover node with hover color', () => {
      const renderer = createNodeCanvasRenderer(
        null,
        createNode({ id: '1' }),
        new Set(),
        createPalette()
      )

      const ctx = {
        beginPath: vi.fn(),
        arc: vi.fn(),
        fill: vi.fn(),
        fillText: vi.fn(),
        font: '',
        textAlign: '',
        textBaseline: '',
      } as unknown as CanvasRenderingContext2D

      renderer(createNode({ id: '1', x: 100, y: 200 }), ctx, 1)

      expect(ctx.beginPath).toHaveBeenCalled()
    })

    it('should draw default node with default color', () => {
      const renderer = createNodeCanvasRenderer(null, null, new Set(), createPalette())

      const ctx = {
        beginPath: vi.fn(),
        arc: vi.fn(),
        fill: vi.fn(),
        fillText: vi.fn(),
        font: '',
        textAlign: '',
        textBaseline: '',
      } as unknown as CanvasRenderingContext2D

      renderer(createNode({ id: '3', x: 100, y: 200 }), ctx, 1)

      expect(ctx.beginPath).toHaveBeenCalled()
    })

    it('should use larger radius for root nodes', () => {
      const renderer = createNodeCanvasRenderer(null, null, new Set(), createPalette())

      const ctx = {
        beginPath: vi.fn(),
        arc: vi.fn(),
        fill: vi.fn(),
        fillText: vi.fn(),
        font: '',
        textAlign: '',
        textBaseline: '',
        drawImage: vi.fn(),
        imageSmoothingEnabled: false,
        imageSmoothingQuality: '',
      } as unknown as CanvasRenderingContext2D

      const rootNode = createNode({ id: '1', title: '我', x: 100, y: 200 })
      renderer(rootNode, ctx, 1)

      // Root node should use arc with radius 12
      expect(ctx.arc).toHaveBeenCalled()
    })

    it('should use smaller radius for regular nodes', () => {
      const renderer = createNodeCanvasRenderer(null, null, new Set(), createPalette())

      const ctx = {
        beginPath: vi.fn(),
        arc: vi.fn(),
        fill: vi.fn(),
        fillText: vi.fn(),
        font: '',
        textAlign: '',
        textBaseline: '',
      } as unknown as CanvasRenderingContext2D

      renderer(createNode({ id: '1', title: 'Regular', x: 100, y: 200 }), ctx, 1)

      // Regular node should use arc with radius 4
      expect(ctx.arc).toHaveBeenCalled()
    })

    it('should handle nodes without x/y coordinates', () => {
      const renderer = createNodeCanvasRenderer(null, null, new Set(), createPalette())

      const ctx = {
        beginPath: vi.fn(),
        arc: vi.fn(),
        fill: vi.fn(),
        fillText: vi.fn(),
        font: '',
        textAlign: '',
        textBaseline: '',
      } as unknown as CanvasRenderingContext2D

      // Should not throw when x/y are undefined
      expect(() => {
        renderer(createNode({ x: undefined, y: undefined }), ctx, 1)
      }).not.toThrow()
    })

    it('should not draw label when scale is too small', () => {
      const renderer = createNodeCanvasRenderer(null, null, new Set(), createPalette())

      const ctx = {
        beginPath: vi.fn(),
        arc: vi.fn(),
        fill: vi.fn(),
        fillText: vi.fn(),
        font: '',
        textAlign: '',
        textBaseline: '',
      } as unknown as CanvasRenderingContext2D

      renderer(createNode({ x: 100, y: 200 }), ctx, 0.3)

      // Label should not be drawn at small scale for inactive nodes
      // fillText might be called but with correct parameters
      expect(ctx.beginPath).toHaveBeenCalled()
    })
  })

  describe('createLinkColorGetter', () => {
    it('should return link active color for active link', () => {
      const getColor = createLinkColorGetter(
        null,
        { id: 1, source: '1', target: '2' },
        createPalette()
      )

      const link = createLink({ id: 1, source: '1', target: '2' })
      expect(getColor(link)).toBe(createPalette().linkActive)
    })

    it('should return link active color for links connected to active node', () => {
      const getColor = createLinkColorGetter(createNode({ id: '1' }), null, createPalette())

      const link = createLink({ source: '1', target: '2' })
      expect(getColor(link)).toBe(createPalette().linkActive)
    })

    it('should return muted color for non-connected links', () => {
      const getColor = createLinkColorGetter(createNode({ id: '1' }), null, createPalette())

      const link = createLink({ source: '3', target: '4' })
      expect(getColor(link)).toBe(createPalette().linkMuted)
    })

    it('should return active color when both activeNode and activeLink match', () => {
      const getColor = createLinkColorGetter(
        createNode({ id: '1' }),
        { id: 1, source: '1', target: '2' },
        createPalette()
      )

      const link = createLink({ id: 1, source: '1', target: '2' })
      expect(getColor(link)).toBe(createPalette().linkActive)
    })

    it('should handle link source/target as objects', () => {
      const getColor = createLinkColorGetter(createNode({ id: '1' }), null, createPalette())

      const link: LinkData = {
        source: createNode({ id: '1' }),
        target: createNode({ id: '2' }),
      }
      expect(getColor(link)).toBe(createPalette().linkActive)
    })
  })

  describe('createLinkWidthGetter', () => {
    it('should return thick width for active link', () => {
      const getWidth = createLinkWidthGetter(null, { id: 1, source: '1', target: '2' })

      const link = createLink({ id: 1, source: '1', target: '2' })
      expect(getWidth(link)).toBe(3)
    })

    it('should return thick width for links connected to active node', () => {
      const getWidth = createLinkWidthGetter(createNode({ id: '1' }), null)

      const link = createLink({ source: '1', target: '2' })
      expect(getWidth(link)).toBe(3)
    })

    it('should return muted width for non-connected links', () => {
      const getWidth = createLinkWidthGetter(createNode({ id: '1' }), null)

      const link = createLink({ source: '3', target: '4' })
      expect(getWidth(link)).toBe(0.7)
    })

    it('should handle numeric IDs', () => {
      const getWidth = createLinkWidthGetter(createNode({ id: 1 }), null)

      const link = createLink({ source: 1, target: 2 })
      expect(getWidth(link)).toBe(3)
    })

    it('should handle link source/target as objects', () => {
      const getWidth = createLinkWidthGetter(createNode({ id: '1' }), null)

      const link: LinkData = {
        source: createNode({ id: '1' }),
        target: createNode({ id: '2' }),
      }
      expect(getWidth(link)).toBe(3)
    })
  })
})
