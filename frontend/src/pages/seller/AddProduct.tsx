import { useEffect, useRef, useState } from 'react'
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
  const [values, setValues] = useState<ProductFormValues>({ ...emptyProductForm })
  const [errors, setErrors] = useState<ProductFormErrors>({})
  const [image, setImage] = useState<ProductImageSelection | null>(null)
  const [imageError, setImageError] = useState<string | undefined>()
  const [imageBusy, setImageBusy] = useState(false)
  const [previewing, setPreviewing] = useState(false)
  const content = useRef<HTMLDivElement>(null)

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
            Public demonstration without login. One future farmer account supports buying and
            selling. No seller identity, ownership check, upload, or publication is performed.
          </p>
          <div className="grid items-start gap-7 lg:grid-cols-[240px_minmax(0,1fr)]">
            <SellerSidebar />
            <div className="min-w-0">
              <h1 className="text-3xl font-bold text-emerald-950">
                {previewing ? 'Review product details' : 'Add Product'}
              </h1>
              <p className="mt-3 mb-7 text-sm leading-6 text-stone-600">
                Prepare a sample agricultural listing and preview its details. Your form and
                selected image stay temporarily on this page and disappear when you leave or reload.
              </p>
              <div ref={content} tabIndex={-1}>
                {previewing ? (
                  <ProductPreview
                    values={values}
                    image={image}
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
