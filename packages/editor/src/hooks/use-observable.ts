import { useEffect, useState } from 'react'
import { Observable } from 'rxjs'

export function useObservable<T>(observable?: Observable<T>, initialValue?: T): T | undefined {
  const [value, setValue] = useState<T | undefined>(initialValue)

  useEffect(() => {
    if (!observable) {
      return
    }
    const subscription = observable.subscribe(setValue)
    return () => subscription.unsubscribe()
  }, [observable])

  return value
}
