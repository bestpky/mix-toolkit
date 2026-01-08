import { createContext, useContext } from 'react'
import { Sdk } from './stage/sdk'

interface ISdkContext {
  sdk: Sdk | null
}

export const SdkContext = createContext<ISdkContext>({
  sdk: null
})

export const useSdk = () => {
  const context = useContext(SdkContext)
  if (!context) {
    throw new Error('useSdk must be used within SdkProvider')
  }
  return context.sdk
}
