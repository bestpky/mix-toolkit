import { createRoot } from 'react-dom/client'

interface IParams {
  x: number
  y: number
  container: HTMLElement
  handleClickEraser: () => void
  handleClickRestore: () => void
}

export function popDropdown(params: IParams) {
  const { container, x, y, handleClickEraser, handleClickRestore } = params
  const div = document.createElement('div')
  div.setAttribute('id', 'dropdown')
  div.style.position = 'absolute'
  div.style.top = `${y}px`
  div.style.left = `${x}px`
  container.appendChild(div)

  createRoot(div).render(<Dropdown handleClickEraser={handleClickEraser} handleClickRestore={handleClickRestore} />)
}

interface IProps {
  handleClickEraser: () => void
  handleClickRestore: () => void
}

export const Dropdown = ({ handleClickEraser, handleClickRestore }: IProps) => {
  return (
    <div className="bg-white flex flex-col py-2 shadow-md">
      <span className="inline-block px-4 py-1.5 cursor-pointer hover:text-[#193AFF]" onClick={handleClickEraser}>
        删除选区内容
      </span>
      <span className="inline-block px-4 py-1.5 cursor-pointer hover:text-[#193AFF]" onClick={handleClickRestore}>
        恢复选区内容
      </span>
    </div>
  )
}
