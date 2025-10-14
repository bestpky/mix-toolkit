import { expect, test } from 'vitest'
import { findItemInTrees } from '../src/find-item-in-trees'

type TreeNode = {
  id: number
  children?: TreeNode[]
}

const treeData: TreeNode[] = [
  {
    id: 1,
    children: [
      { id: 11 },
      {
        id: 12,
        children: [{ id: 121 }, { id: 122 }]
      }
    ]
  },
  {
    id: 2,
    children: [
      { id: 21 },
      { id: 22 },
      {
        id: 23,
        children: [{ id: 231 }, { id: 232 }]
      }
    ]
  }
]

test('find by value', () => {
  expect(findItemInTrees(treeData, 1)).toEqual(treeData[0])
  expect(findItemInTrees(treeData, 11)).toEqual(treeData[0].children?.[0])
  expect(findItemInTrees(treeData, 121)).toEqual(treeData[0].children?.[1].children?.[0])
  expect(findItemInTrees(treeData, 2)).toEqual(treeData[1])
  expect(findItemInTrees(treeData, 22)).toEqual(treeData[1].children?.[1])
  expect(findItemInTrees(treeData, 231)).toEqual(treeData[1].children?.[2].children?.[0])
  expect(findItemInTrees(treeData, 999)).toBeNull()
})

// TODO
// test('find by iterator', () => {
//   expect(findItemInTrees(treeData, item => item.id === 1)).toEqual(treeData[0])
//   expect(findItemInTrees(treeData, item => item.id === 11)).toEqual(treeData[0].children?.[0])
//   expect(findItemInTrees(treeData, item => item.id === 121)).toEqual(treeData[0].children?.[1].children?.[0])
//   expect(findItemInTrees(treeData, item => item.id === 2)).toEqual(treeData[1])
//   expect(findItemInTrees(treeData, item => item.id === 22)).toEqual(treeData[1].children?.[1])
//   expect(findItemInTrees(treeData, item => item.id === 231)).toEqual(treeData[1].children?.[2].children?.[0])
//   expect(findItemInTrees(treeData, item => item.id === 999)).toBeUndefined()
// })
