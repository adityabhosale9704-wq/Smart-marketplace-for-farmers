import { useEffect, useId, useRef } from 'react'
import type { ProductImageSelection } from '../../types/productForm'
import { validateProductImage } from '../../utils/productValidation'

interface ProductImageUploadProps {
  image: ProductImageSelection | null
  error?: string
  busy: boolean
  onChange: (image: ProductImageSelection | null, error?: string) => void
  onBusy: (busy: boolean) => void
}

export default function ProductImageUpload({ image, error, busy, onChange, onBusy }: ProductImageUploadProps) {
  const id = useId()
  const generation = useRef(0)
  const pendingUrl = useRef<string | null>(null)

  useEffect(() => () => {
    generation.current++
    if (pendingUrl.current) URL.revokeObjectURL(pendingUrl.current)
  }, [])

  async function selectFile(file?: File) {
    if (!file) return
    const request = ++generation.current
    if (pendingUrl.current) URL.revokeObjectURL(pendingUrl.current)
    pendingUrl.current = null
    onChange(null)
    const validationError = validateProductImage(file)
    if (validationError) { onBusy(false); onChange(null, validationError); return }
    onBusy(true)
    const url = URL.createObjectURL(file)
    pendingUrl.current = url
    try {
      const picture = new Image()
      picture.src = url
      await picture.decode()
      if (!picture.naturalWidth || !picture.naturalHeight) throw new Error('Invalid image')
      if (generation.current !== request) return
      pendingUrl.current = null
      onChange({ file, url })
    } catch {
      if (generation.current === request) onChange(null, 'This image could not be read. Choose another JPG, PNG, or WebP file.')
    } finally {
      if (generation.current !== request || pendingUrl.current === url) URL.revokeObjectURL(url)
      if (generation.current === request) { pendingUrl.current = null; onBusy(false) }
    }
  }

  function remove() {
    generation.current++
    if (pendingUrl.current) URL.revokeObjectURL(pendingUrl.current)
    pendingUrl.current = null
    onBusy(false)
    onChange(null)
  }

  return (
    <fieldset className="rounded-xl border border-stone-200 p-4">
      <legend className="px-1 text-sm font-semibold">Product image (optional)</legend>
      <label htmlFor={id} className="text-sm text-stone-600">Choose or replace an image</label>
      <input id={id} name="image" type="file" accept="image/jpeg,image/png,image/webp" aria-invalid={!!error}
        aria-describedby={`${id}-help${error ? ' ' + id + '-error' : ''}`}
        onChange={event => { void selectFile(event.target.files?.[0]); event.target.value = '' }}
        className="mt-3 block w-full min-w-0 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-emerald-50 file:px-3 file:py-2 file:text-emerald-900" />
      <p id={`${id}-help`} className="mt-3 text-xs leading-5 text-stone-500">JPG, PNG, or WebP. Maximum 5 MB. Local preview only; nothing is uploaded.</p>
      {busy && <p role="status" className="mt-2 text-sm text-stone-600">Checking image...</p>}
      {image && <div className="mt-4"><img src={image.url} alt="Selected product preview" className="h-48 w-full rounded-xl bg-emerald-50 object-contain" onError={() => { onChange(null, 'The selected image could not be displayed. Please choose another file.') }} /><p className="mt-2 break-all text-xs text-stone-500">{image.file.name}</p></div>}
      {(image || error || busy) && <button type="button" onClick={remove} className="mt-3 text-sm font-semibold text-emerald-800 underline">Remove / clear image</button>}
      {error && <p id={`${id}-error`} role="alert" className="mt-3 text-sm text-red-700">{error}</p>}
    </fieldset>
  )
}
