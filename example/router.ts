import { createBrowserRouter } from 'react-router'

import { HomePage, OpenModalPage, BetterLazyImagePage, EditorPage } from './pages'

export const router = createBrowserRouter([
  {
    path: '/',
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
  }
])
