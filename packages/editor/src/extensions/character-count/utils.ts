import { Editor } from '@tiptap/core'
import { BehaviorSubject, from, fromEvent } from 'rxjs'
import { map, startWith, switchMap, filter, debounceTime } from 'rxjs/operators'
import { Node } from '@tiptap/pm/model'

/**
 * 条件一：字数统计
 * 规则：
 * 1. 中文字符、日韩文字符、全角符号等计为1字
 * 2. 拉丁字母、数字、半角符号等连续字符视为单词，每个单词计为1字
 * 3. 空格、换行符等不计入字数
 * 示例："你好world" → 3字 (你=1, 好=1, world=1)
 */
export function countWords(
  preText: string,
  isForceUpdate = false,
  chunkSize: number = 5000
): { resultPromise: Promise<number>; cancel: () => void } {
  let isCancel = false
  let time = 0
  let _originRej = () => {}
  let repeatCount = 0
  const cancel = () => {
    if (isForceUpdate || isCancel) {
      return false
    }
    isCancel = true
    clearTimeout(time)
    _originRej()
    return true
  }
  return {
    cancel,
    resultPromise: new Promise<number>((res, rej) => {
      let count = 0
      let index = 0
      let text = ''
      let len = 0
      /**
       *  标识是不是初始化
       */
      let isFirst = true

      _originRej = () => rej('cancel!!')

      const loop = () => {
        if (isCancel) {
          return _originRej()
        }
        repeatCount++
        if (isFirst) {
          text = preText
          len = text.length
          isFirst = false
        }
        const chunk = text.slice(index)
        const result = countWordsSync(chunk, chunkSize)
        count = result.count + count
        index = result.index + index
        if (index < len) {
          time = setTimeout(loop, 0)
        } else {
          res(count)
        }
      }
      time = setTimeout(loop, isForceUpdate ? 0 : 50)
    })
  }
}

export const LINE_BREAK = '\uE001' // 换行符

export const regForIndependentCharacters =
  /[\u4E00-\u9FFF\u3400-\u4DBF\uF900-\uFAFF\u3040-\u309F\u30A0-\u30FF\uAC00-\uD7AF\uFF00-\uFFEF\u3000-\u303F\u2000-\u206F\u2E00-\u2E7F]/u
// Unicode 范围说明：
// \u4E00-\u9FFF: CJK统一汉字 (中文)
// \u3400-\u4DBF: CJK扩展A区
// \uF900-\uFAFF: CJK兼容汉字
// \u3040-\u309F: 平假名 (日文)
// \u30A0-\u30FF: 片假名 (日文)
// \uAC00-\uD7AF: 韩文音节
// \uFF00-\uFFEF: 全角ASCII、全角符号、半角片假名 (包括！？：；，等)
// \u3000-\u303F: CJK符号和标点 (包括中文标点符号：。、「」等)
// \u2000-\u206F: 通用标点符号 (包括各种引号、破折号等)
// \u2E00-\u2E7F: 补充标点符号

export const refForEmpty = /[\s\u3000]/

/**
 * 同步版本的字数统计（用于内部处理分片）
 */
function countWordsSync(text: string, chunkSize: number): { count: number; index: number } {
  let count = 0
  let index = 0
  const len = text.length

  while (index < len && index < chunkSize) {
    const char = text.charAt(index)
    // 跳过所有空白字符（包括空格、换行、全角空格等）
    if (refForEmpty.test(char) || char === LINE_BREAK) {
      index++
      continue
    }

    // 检查是否为CJK字符或全角字符（中日韩字符集+全角符号）
    if (regForIndependentCharacters.test(char)) {
      // CJK/全角字符：单字计数
      count++
      index++
    } else {
      // 非CJK字符：整个连续单词计1字
      count++

      // 跳过当前单词的所有连续非CJK字符
      while (index < len) {
        const nextChar = text.charAt(index)
        // 遇到空白或CJK字符时停止
        if (refForEmpty.test(nextChar) || regForIndependentCharacters.test(nextChar) || nextChar === LINE_BREAK) {
          break
        }
        index++
      }
      // 此时index已指向单词末尾，外层循环会继续处理下一个字符
    }
  }

  return { count, index }
}

/**
 * 条件二：字符数（不含空格）
 * 规则：
 * 1. 所有可见字符均计为1个字符
 * 2. 空格、换行符等不计入
 * 示例："你好 world" → 7字符 (你好=2, world=5)
 */
export function countCharsWithoutSpaces(text: string): number {
  // 移除所有空白字符（空格/制表符/换行/全角空格）后计算长度
  return text.replace(/[\s\u3000]/g, '').length
}

/**
 * 条件三：字符数（含空格）
 * 规则：
 * 1. 所有可见字符均计为1个字符
 * 2. 空格、制表符、换行符等均计入
 * 示例："你好 world" → 8字符 (你好=2, 空格=1, world=5)
 */
export function countCharsIncludingSpaces(text: string): number {
  // 直接返回原始字符串长度（包含所有字符）
  return text.replaceAll('\n', '').length
}

function getTextFromRange(doc: Node, from: number, to: number): string {
  let text = ''
  // 遍历指定范围内的所有节点
  try {
    // 只有跨段落的时候,才会新增一个分隔符.
    // 其text/mention 是一定会被包裹在 heading/paragraph 节点内的,所以重置 isParagraphFirstTextNode 状态可以放在之前.
    let isParagraphFirstTextNode = false
    doc.nodesBetween(from, to, (node: Node, pos: number) => {
      if (['heading', 'paragraph'].includes(node.type.name)) {
        isParagraphFirstTextNode = true
      }
      // 只处理文本节点
      if (node.isText) {
        const nodeStart = pos
        // 计算在当前文本节点中需要提取的范围
        const start = Math.max(from - nodeStart, 0)
        const end = Math.min(to - nodeStart, node.text!.length)

        // 提取文本片段
        if (start < end) {
          text += `${isParagraphFirstTextNode ? LINE_BREAK : ''}${node.text!.slice(start, end)}`
        }
        isParagraphFirstTextNode = false
      } else if (node.type.name === 'mention') {
        text += `${LINE_BREAK}@${node.attrs.id}${LINE_BREAK}`
        isParagraphFirstTextNode = false
      }
      // 对于非叶子节点，继续遍历其子节点
      return node.isLeaf ? false : true
    })
  } catch (err) {
    return text
  }

  return text
}

const INIT_VALUE = { words: -1, charsWithoutSpaces: -1, charsIncludingSpaces: -1 }
const metaKey = 'CharacterCountStoreInit'

export class CharacterCountStore {
  public isInit = false

  public store$ = new BehaviorSubject(INIT_VALUE)

  constructor(private editor: Editor, private debounceTime = 500) {}

  public init() {
    const transactionEvent = fromEvent(this.editor, 'transaction').pipe(
      filter((info: any) => {
        // 只有当文档内容发生变更时才触发
        // transaction.docChanged 表示文档结构或内容是否发生变化
        return info.transaction && (info.transaction.docChanged || info.transaction.getMeta(metaKey))
      })
    )
    let cancel = () => {}

    // 使用 switchMap 自动取消上一次计算
    const subscribe = transactionEvent
      .pipe(
        startWith({ isForced: true }), // 初始化时触发一次
        debounceTime(this.debounceTime),
        switchMap(({ isForced }) => {
          cancel()
          const text = getTextFromRange(this.editor.state.doc, 0, this.editor.state.doc.nodeSize) || '' // 在这里获取文本
          const result = countWords(text, isForced, 10000)
          cancel = result.cancel
          return from(result.resultPromise).pipe(map(words => ({ words, text })))
        })
      )
      .subscribe({
        next: ({ words, text }) => {
          this.isInit = true
          const textWithoutLineBreak = text.replaceAll(LINE_BREAK, '')
          const result = {
            words,
            charsWithoutSpaces: countCharsWithoutSpaces(textWithoutLineBreak),
            charsIncludingSpaces: countCharsIncludingSpaces(textWithoutLineBreak)
          }
          this.store$.next(result)
        },
        error: err => {
          if (err !== 'cancel!' && err !== 'cancel!!') {
            this.store$.next({
              ...INIT_VALUE
            })
          }
        }
      })
    this.editor.view.dispatch(this.editor.state.tr.setMeta(metaKey, true))
    return () => {
      this.isInit = false
      subscribe.unsubscribe()
    }
  }
}
