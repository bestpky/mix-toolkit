import { createContext, useContext } from 'react'
import { FullWidthCanvasSDK2 } from './sdk'

export interface FullWidthSDK2WithGenerate extends FullWidthCanvasSDK2 {
  generateEffectAndCreateTask?: () => Promise<string | undefined>
}

export interface FullWidthContextValue {
  fwSdk2: FullWidthSDK2WithGenerate | null
}

export const FullWidthContext = createContext<FullWidthContextValue | null>(null)

export const useFullWidthContext = () => {
  const context = useContext(FullWidthContext)
  if (!context) {
    throw new Error('useFullWidthContext must be used within FullWidthContext.Provider')
  }
  return context
}
