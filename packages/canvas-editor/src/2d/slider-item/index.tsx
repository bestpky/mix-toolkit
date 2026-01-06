import Slider from 'rc-slider'
import 'rc-slider/assets/index.css'
import { FC, memo, useEffect, useState } from 'react'

interface IProps {
  name: string
  value: number
  min?: number
  max?: number
  digits?: 0 | 1 | 2
  isAngle?: boolean
  disabled?: boolean
  onChange?: (newValue: number, input: boolean) => void
  forceUpdateValueTime?: number
}

const _SliderItem: FC<IProps> = props => {
  const {
    name,
    value,
    isAngle = false,
    min = 0,
    max = 100,
    digits = 0,
    onChange,
    disabled = false,
    forceUpdateValueTime
  } = props
  const [val, setVal] = useState<string>(Math.max(Math.min(value, max), min).toString())
  useEffect(() => {
    setVal(Math.max(Math.min(value, max), min).toString())
  }, [value, forceUpdateValueTime, max, min])

  return (
    <div className="group">
      <div
        className="flex items-center justify-between relative"
        onKeyDown={e => {
          e.stopPropagation()
        }}
      >
        <span className="text-gray-600 text-xs whitespace-nowrap">{name}</span>

        {isAngle && (
          <span className="text-gray-600 absolute right-1.5 top-1">
            °
          </span>
        )}
      </div>
      <div>
        <Slider
          value={Number(val)}
          min={min}
          max={max}
          step={digits === 1 ? 0.1 : digits === 2 ? 0.01 : 1}
          disabled={disabled}
          onChange={e => {
            const _e = e as number
            setVal(_e.toString())
            onChange?.(_e, false)
          }}
          styles={{
            rail: { backgroundColor: '#d9d9d9', height: 2 },
            track: { backgroundColor: '#262626', height: 2 },
            handle: {
              backgroundColor: '#fff',
              border: '1px solid #454547',
              boxShadow: 'none',
              width: 12,
              height: 12,
              marginTop: -5,
              opacity: 1
            }
          }}
        />
      </div>
    </div>
  )
}

export const SliderItem = memo(_SliderItem, (prev, next) => {
  if (
    prev.onChange !== next.onChange ||
    prev.name !== next.name ||
    prev.value !== next.value ||
    prev.min !== next.min ||
    prev.max !== next.max ||
    prev.disabled !== next.disabled ||
    prev.forceUpdateValueTime !== next.forceUpdateValueTime
  ) {
    return false
  }
  return true
})
