import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import { createServer } from 'vite'

const server = await createServer({ server: { middlewareMode: true } })
try {
  const load = path => server.ssrLoadModule('/src/' + path)
  const { validateProduct, validateProductImage, MAX_IMAGE_BYTES } = await load(
    'utils/productValidation.ts',
  )
  const { emptyProductForm } = await load('types/productForm.ts')
  const { default: Preview } = await load('components/seller/ProductPreview.tsx')
  const { default: AddProduct } = await load('pages/seller/AddProduct.tsx')
  const { default: Dashboard } = await load('pages/seller/SellerDashboard.tsx')
  const { CartContext } = await load('context/cartContextValue.ts')
  const { AuthContext } = await load('context/authContextValue.ts')
  const today = '2026-11-06'
  const valid = {
    ...emptyProductForm,
    name: 'Sample Tomatoes',
    category: 'vegetables',
    description: 'Sample agricultural produce for a demonstration preview.',
    price: '32.50',
    unit: 'kg',
    stock: '125.25',
    city: 'Nashik',
    district: 'Nashik',
    state: 'Maharashtra',
    harvestDate: '2026-11-01',
  }
  assert.deepEqual(validateProduct(valid, today).errors, {})
  assert.equal(
    validateProduct({ ...valid, name: '  Sample   Tomatoes  ' }, today).values.name,
    'Sample Tomatoes',
  )
  for (const field of [
    'name',
    'description',
    'category',
    'price',
    'unit',
    'stock',
    'city',
    'district',
    'state',
  ])
    assert.ok(validateProduct({ ...valid, [field]: '' }, today).errors[field], field)
  for (const price of [
    '0',
    '-1',
    'NaN',
    'Infinity',
    '1e9',
    '1000001',
    '9007199254740992',
    '0.001',
    ' ',
  ])
    assert.ok(validateProduct({ ...valid, price }, today).errors.price)
  for (const stock of ['-1', 'NaN', 'Infinity', '1e9', '1000001', '2.555'])
    assert.ok(validateProduct({ ...valid, stock }, today).errors.stock)
  assert.deepEqual(validateProduct({ ...valid, stock: '0', harvestDate: '' }, today).errors, {})
  assert.ok(validateProduct({ ...valid, category: 'unknown' }, today).errors.category)
  assert.ok(validateProduct({ ...valid, unit: 'litre' }, today).errors.unit)
  for (const harvestDate of ['2026-02-30', '2026-13-01', '2027-01-01', 'invalid', '1899-12-31'])
    assert.ok(validateProduct({ ...valid, harvestDate }, today).errors.harvestDate)
  assert.deepEqual(validateProduct({ ...valid, harvestDate: '2024-02-29' }, today).errors, {})
  for (const type of ['image/jpeg', 'image/png', 'image/webp'])
    assert.equal(validateProductImage({ type, size: MAX_IMAGE_BYTES }), undefined)
  assert.ok(validateProductImage({ type: 'image/svg+xml', size: 20 }))
  assert.ok(validateProductImage({ type: 'image/png', size: MAX_IMAGE_BYTES + 1 }))
  assert.ok(validateProductImage({ type: 'image/png', size: 0 }))
  const cart = {
    cartItems: [],
    totalItemCount: 0,
    estimatedSubtotal: 0,
    message: '',
    storageWarning: false,
    addItem() {},
    removeItem() {},
    updateQuantity() {},
    clearCart() {},
  }
  const render = element =>
    renderToStaticMarkup(
      createElement(
        CartContext.Provider,
        { value: cart },
        createElement(MemoryRouter, { initialEntries: ['/seller/add-product'] }, element),
      ),
    )
  assert.match(render(createElement(AddProduct)), /log in/)
  const form = render(
    createElement(
      AuthContext.Provider,
      {
        value: {
          session: { user: { id: 'seller', email: 'seller@example.test' }, accessToken: 'fixture' },
          checking: false,
          async signOut() {},
        },
      },
      createElement(AddProduct),
    ),
  )
  assert.ok(form.includes('Preview Product'))
  assert.ok(form.includes('name="stock"'))
  assert.ok(form.includes('accept="image/jpeg,image/png,image/webp"'))
  assert.ok(form.includes('href="/seller/add-product"'))
  const dashboard = render(createElement(Dashboard))
  assert.ok(dashboard.includes('href="/seller/add-product"'))
  let edited = false
  const preview = render(
    createElement(Preview, {
      values: valid,
      image: null,
      onEdit: () => {
        edited = true
      },
    }),
  )
  assert.ok(preview.includes('This product is not saved yet.'))
  const savePreview = render(
    createElement(Preview, { values: valid, image: null, onEdit() {}, onSave() {}, saving: false }),
  )
  assert.match(savePreview, />Save Draft</)
  assert.match(savePreview, />Publish</)
  assert.ok(preview.includes('125.25 kg'))
  assert.ok(preview.includes('2026-11-01'))
  assert.ok(preview.includes('Edit Details'))
  // Preview has no hooks, so its edit handler can be checked without an extra test package.
  const tree = Preview({
    values: valid,
    image: null,
    onEdit: () => {
      edited = true
    },
  })
  const visit = node => {
    if (!node || typeof node !== 'object') return
    if (node.type === 'button' && node.props.children === 'Edit Details') node.props.onClick()
    for (const child of [node.props?.children].flat()) visit(child)
  }
  visit(tree)
  assert.equal(edited, true)
  const imageSource = await readFile(
    new URL('../src/components/seller/ProductImageUpload.tsx', import.meta.url),
    'utf8',
  )
  assert.ok(imageSource.includes('picture.decode()'))
  assert.ok(imageSource.includes('URL.revokeObjectURL'))
  assert.ok(imageSource.includes('generation.current'))
  for (const path of [
    'pages/seller/AddProduct.tsx',
    'components/seller/ProductForm.tsx',
    'components/seller/ProductImageUpload.tsx',
    'components/seller/ProductPreview.tsx',
  ]) {
    const source = await readFile(new URL('../src/' + path, import.meta.url), 'utf8')
    assert.ok(!/localStorage|sessionStorage|fetch\(|FileReader|console\./.test(source))
  }
  assert.ok(
    (await readFile(new URL('../src/App.tsx', import.meta.url), 'utf8')).includes(
      'path="/seller/add-product"',
    ),
  )
  console.log(
    'PASS: route/navigation, empty/valid form rendering, decimal/zero-stock preview, required fields, invalid numeric/category/unit values, date/leap-year bounds, image MIME/size rules, Edit handler, and no storage/network calls.',
  )
  console.log(
    'Manual browser checks remain: Preview/Edit flow and focus, real image selection/replacement/removal/corruption, blob lifecycle, responsive layout, and keyboard use.',
  )
} finally {
  await server.close()
}
