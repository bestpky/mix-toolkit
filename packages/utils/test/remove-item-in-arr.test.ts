import { expect, test } from 'vitest'
import { removeItemInArr } from '../src/remove-item-in-arr'

test('number item', () => {
  const arr = [1, 2, 3, 2, 4]
  expect(removeItemInArr(arr, 2)).toBe(1)
  expect(arr).toEqual([1, 3, 2, 4])
})

test('string item', () => {
  const arr = ['a', 'b', 'c', 'b', 'd']
  expect(removeItemInArr(arr, 'b')).toBe(1)
  expect(arr).toEqual(['a', 'c', 'b', 'd'])
})

test('object item', () => {
  const obj1 = { a: 1 }
  const obj2 = { a: 2 }
  const arr = [obj1, obj2]
  expect(removeItemInArr(arr, obj1)).toBe(0)
  expect(arr).toEqual([obj2])
})

test('not exist item', () => {
  const arr = [1, 2, 3]
  expect(removeItemInArr(arr, 4)).toBeUndefined()
  expect(arr).toEqual([1, 2, 3])
})

test('iterator item', () => {
  const arr = [1, 2, 3, 4]
  expect(removeItemInArr(arr, item => item % 2 === 0)).toBe(1)
  expect(arr).toEqual([1, 3, 4])
  expect(removeItemInArr(arr, item => item > 3)).toBe(2)
  expect(arr).toEqual([1, 3])
  expect(removeItemInArr(arr, item => item === 5)).toBeUndefined()
  expect(arr).toEqual([1, 3])
})
