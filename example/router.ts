import { createBrowserRouter } from 'react-router'

import { HomePage, OpenModalPage, BetterLazyImagePage, EditorPage, CanvasEditorPage } from './pages'
import { Layout } from './layout'

export const router = createBrowserRouter([
  {
    path: '/',
    Component: Layout,
    children: [
      {
        index: true,
        Component: HomePage
      },
      {
        path: 'open-modal',
        Component: OpenModalPage
      },
      {
        path: 'better-lazy-image',
        Component: BetterLazyImagePage
      },
      {
        path: 'editor',
        Component: EditorPage
      },
      {
        path: 'canvas-editor',
        Component: CanvasEditorPage
      }
    ]
  }
])
