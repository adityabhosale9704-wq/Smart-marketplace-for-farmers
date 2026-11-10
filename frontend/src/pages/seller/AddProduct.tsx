import { useContext, useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AuthContext } from '../../context/authContextValue'
import { createProduct } from '../../services/products'
import type { FormEvent } from 'react'
import Navbar from '../../components/Navbar'
import Footer from '../../components/Footer'
import SellerSidebar from '../../components/seller/SellerSidebar'
import ProductForm from '../../components/seller/ProductForm'
import ProductPreview from '../../components/seller/ProductPreview'
import { emptyProductForm } from '../../types/productForm'
import type {
  ProductFormErrors,
  ProductFormValues,
  ProductImageSelection,
} from '../../types/productForm'
import { validateProduct } from '../../utils/productValidation'

export default function AddProduct() {
  const auth = useContext(AuthContext)
  const navigate = useNavigate()
  const [values, setValues] = useState<ProductFormValues>({ ...emptyProductForm })
  const [errors, setErrors] = useState<ProductFormErrors>({})
  const [image, setImage] = useState<ProductImageSelection | null>(null)
  const [imageError, setImageError] = useState<string | undefined>()
  const [imageBusy, setImageBusy] = useState(false)
  const [previewing, setPreviewing] = useState(false)
  const content = useRef<HTMLDivElement>(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const pending = useRef<AbortController | null>(null)

  useEffect(() => {
    // Reset a cancelled save when the signed-in account changes.
    // oxlint-disable-next-line react/set-state-in-effect
    setSaving(false)
    return () => {
      pending.current?.abort()
      pending.current = null
    }
  }, [auth?.session?.user.id])

  async function save(status: 'draft' | 'published') {
    const userId = auth?.session?.user.id
    if (!userId || pending.current) return
    const result = validateProduct(values)
    if (status === 'published' && Number(result.values.stock) <= 0)
      result.errors.stock = 'Publishing requires stock above zero. Save a draft instead.'
    setErrors(result.errors)
    if (Object.values(result.errors).some(Boolean)) {
      setSaveError(Object.values(result.errors).find(Boolean) ?? 'Check your product details.')
      setPreviewing(false)
      return
    }
    const controller = new AbortController()
    pending.current = controller
    setSaving(true)
    setSaveError('')
    try {
      const product = await createProduct(userId, result.values, status, controller.signal)
      if (!controller.signal.aborted)
        navigate('/seller/products', {
          state: {
            savedProductId: product.id,
          },
        })
    } catch (error) {
      if (!controller.signal.aborted)
        setSaveError(error instanceof Error ? error.message : 'The product could not be saved.')
    } finally {
      if (pending.current === controller) pending.current = null
      if (!controller.signal.aborted) setSaving(false)
    }
  }

  // The accepted blob URL belongs to this page; release it on replacement or leaving.
  useEffect(
    () => () => {
      if (image) URL.revokeObjectURL(image.url)
    },
    [image],
  )

  function change(field: keyof ProductFormValues, value: string) {
    setValues(previous => ({ ...previous, [field]: value }))
    setErrors(previous => {
      const next = { ...previous }
      delete next[field]
      return next
    })
  }

  function changeImage(selection: ProductImageSelection | null, error?: string) {
    setImage(selection)
    setImageError(error)
    setErrors(previous => ({ ...previous, image: error }))
  }

  function preview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (imageBusy) return
    const result = validateProduct(values)
    if (imageError) result.errors.image = imageError
    setValues(result.values)
    setErrors(result.errors)
    if (Object.values(result.errors).some(Boolean)) {
      const field = Object.keys(result.errors)[0]
      event.currentTarget.querySelector<HTMLElement>(`[name="${field}"]`)?.focus()
      return
    }
    setPreviewing(true)
    content.current?.focus()
  }

  return (
    <>
      <Navbar />
      <main id="main-content" className="min-h-screen bg-stone-50 py-8 sm:py-12">
        <div className="page-width">
          <p className="mb-7 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
            Preview does not save a listing. Save Draft keeps it unpublished; Publish makes an
            in-stock listing visible in the Marketplace. Orders and purchasing are not connected
            yet.
          </p>
          <div className="grid items-start gap-7 lg:grid-cols-[240px_minmax(0,1fr)]">
            <SellerSidebar />
            <div className="min-w-0">
              <h1 className="text-3xl font-bold text-emerald-950">
                {previewing ? 'Review product details' : 'Add Product'}
              </h1>
              <p className="mt-3 mb-7 text-sm leading-6 text-stone-600">
                Enter your product details and preview them before saving. Image selection is a
                local preview only; image uploads are not connected yet.
              </p>
              <div ref={content} tabIndex={-1}>
                {saveError && (
                  <p role="alert" className="mb-5 text-sm text-red-700">
                    {saveError}
                  </p>
                )}
                {auth?.checking ? (
                  <p role="status">Checking your session...</p>
                ) : !auth?.session ? (
                  <p>
                    Please{' '}
                    <Link to="/login" className="text-emerald-800 underline">
                      log in
                    </Link>{' '}
                    to save your products.
                  </p>
                ) : previewing ? (
                  <ProductPreview
                    values={values}
                    image={image}
                    onSave={save}
                    saving={saving}
                    onEdit={() => {
                      setPreviewing(false)
                      content.current?.focus()
                    }}
                  />
                ) : (
                  <ProductForm
                    values={values}
                    errors={errors}
                    image={image}
                    imageBusy={imageBusy}
                    onChange={change}
                    onImageChange={changeImage}
                    onImageBusy={setImageBusy}
                    onPreview={preview}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
