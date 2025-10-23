import { Link } from 'react-router'

export const HomePage = () => {
  return (
    <>
      <h1>Index</h1>
      <Link to="open-modal">Open Modal</Link>
      <br />
      <br />
      <Link to="better-lazy-image">Lazy Image</Link>
      <br />
      <br />
      <Link to="editor">Editor</Link>
    </>
  )
}
