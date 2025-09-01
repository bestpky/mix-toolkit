import { createBrowserRouter } from 'react-router'

import { HomePage, OpenModalPage } from './pages'

export const router = createBrowserRouter([
  {
    path: '/',
    Component: HomePage
  },
  {
    path: 'open-modal',
    Component: OpenModalPage
  }
])
