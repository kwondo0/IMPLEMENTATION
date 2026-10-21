'use server'

import bcrypt from 'bcryptjs'
import { AuthError } from 'next-auth'
import { redirect } from 'next/navigation'
import { signIn, signOut } from '@/auth'
import { CommerceError } from '@/lib/commerce-error'
import { connectDB } from '@/lib/mongodb'
import { parsePositiveInteger, getRawString, getString } from '@/lib/format'
import {
  createOrder,
  cancelOrder,
  payOrder,
  changeOrderStatus,
} from '@/lib/orders'
import { requireAdmin, requireUser } from '@/lib/authz'
import { Cart } from '@/models/Cart'
import { Coupon } from '@/models/Coupon'
import { Product } from '@/models/Product'
import { User } from '@/models/User'

function withMessage(path: string, message: string): never {
  redirect(`${path}?message=${encodeURIComponent(message)}`)
}

async function handleCommerceAction(path: string, action: () => Promise<void>) {
  try {
    await action()
  } catch (error) {
    if (error instanceof CommerceError) withMessage(path, error.message)
    throw error
  }
}

export async function loginAction(formData: FormData) {
  const email = getString(formData, 'email').toLowerCase()
  const password = getRawString(formData, 'password')
  if (!email || !password)
    withMessage('/login', '이메일과 비밀번호를 입력해 주세요.')
  try {
    await signIn('credentials', { email, password, redirectTo: '/orders' })
  } catch (error) {
    if (error instanceof AuthError)
      withMessage('/login', '이메일 또는 비밀번호를 확인해 주세요.')
    throw error
  }
}

export async function logoutAction() {
  await signOut({ redirectTo: '/' })
}

export async function registerAction(formData: FormData) {
  const name = getString(formData, 'name')
  const email = getString(formData, 'email').toLowerCase()
  const password = getRawString(formData, 'password')
  if (name.length < 2 || name.length > 60)
    withMessage('/register', '이름은 2~60자로 입력해 주세요.')
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    withMessage('/register', '올바른 이메일을 입력해 주세요.')
  if (password.length < 8 || new TextEncoder().encode(password).length > 72) {
    withMessage(
      '/register',
      '비밀번호는 8자 이상, UTF-8 기준 72바이트 이하여야 합니다.',
    )
  }

  await connectDB()
  const passwordHash = await bcrypt.hash(password, 12)
  try {
    await User.create({ name, email, passwordHash, role: 'user' })
  } catch (error) {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 11000
    ) {
      withMessage('/register', '이미 가입된 이메일입니다.')
    }
    throw error
  }
  try {
    await signIn('credentials', { email, password, redirectTo: '/products' })
  } catch (error) {
    if (error instanceof AuthError)
      withMessage('/login', '가입은 완료되었습니다. 로그인해 주세요.')
    throw error
  }
}

export async function addToCartAction(formData: FormData) {
  await handleCommerceAction('/cart', async () => {
    const user = await requireUser()
    const productId = getString(formData, 'productId')
    const qty = parsePositiveInteger(getString(formData, 'qty') || '1', '수량')
    if (!/^[a-f\d]{24}$/i.test(productId))
      throw new CommerceError('상품을 찾을 수 없습니다.')
    await connectDB()
    const product = await Product.findById(productId)
    if (!product) throw new CommerceError('상품을 찾을 수 없습니다.')

    const cart =
      (await Cart.findOne({ userId: user.id })) ??
      new Cart({ userId: user.id, items: [] })
    const existing = cart.items.find(
      (item) => String(item.productId) === productId,
    )
    const nextQty = (existing?.qty ?? 0) + qty
    if (nextQty > product.stock)
      throw new CommerceError('요청한 수량이 현재 재고보다 많습니다.')
    if (existing) existing.qty = nextQty
    else cart.items.push({ productId: product._id, qty })
    await cart.save()
  })
  withMessage('/cart', '장바구니에 담았습니다.')
}

export async function updateCartItemAction(formData: FormData) {
  await handleCommerceAction('/cart', async () => {
    const user = await requireUser()
    const productId = getString(formData, 'productId')
    const qty = parsePositiveInteger(getString(formData, 'qty'), '수량')
    if (!/^[a-f\d]{24}$/i.test(productId))
      throw new CommerceError('상품을 찾을 수 없습니다.')
    await connectDB()
    const product = await Product.findById(productId)
    if (!product || qty > product.stock)
      throw new CommerceError('요청한 수량이 현재 재고보다 많습니다.')
    const result = await Cart.updateOne(
      { userId: user.id, 'items.productId': product._id },
      { $set: { 'items.$.qty': qty } },
    )
    if (result.matchedCount !== 1)
      throw new CommerceError('장바구니 상품을 찾을 수 없습니다.')
  })
  withMessage('/cart', '수량을 변경했습니다.')
}

export async function removeCartItemAction(formData: FormData) {
  await handleCommerceAction('/cart', async () => {
    const user = await requireUser()
    const productId = getString(formData, 'productId')
    if (!/^[a-f\d]{24}$/i.test(productId))
      throw new CommerceError('상품을 찾을 수 없습니다.')
    await connectDB()
    await Cart.updateOne(
      { userId: user.id },
      { $pull: { items: { productId } } },
    )
  })
  withMessage('/cart', '상품을 장바구니에서 삭제했습니다.')
}

export async function createOrderAction(formData: FormData) {
  await handleCommerceAction('/cart', async () => {
    const user = await requireUser()
    const couponId = getString(formData, 'couponId')
    if (couponId && !/^[a-f\d]{24}$/i.test(couponId))
      throw new CommerceError('쿠폰을 확인할 수 없습니다.')
    const orderId = await createOrder(user.id, couponId || undefined)
    redirect(`/orders/${orderId}`)
  })
}

export async function payOrderAction(formData: FormData) {
  await handleCommerceAction('/orders', async () => {
    const user = await requireUser()
    const orderId = getString(formData, 'orderId')
    if (!/^[a-f\d]{24}$/i.test(orderId))
      throw new CommerceError('주문을 찾을 수 없습니다.')
    await payOrder(orderId, user.id)
    redirect(
      `/orders/${orderId}?message=${encodeURIComponent('가짜 결제가 완료되었습니다.')}`,
    )
  })
}

export async function cancelOrderAction(formData: FormData) {
  await handleCommerceAction('/orders', async () => {
    const user = await requireUser()
    const orderId = getString(formData, 'orderId')
    if (!/^[a-f\d]{24}$/i.test(orderId))
      throw new CommerceError('주문을 찾을 수 없습니다.')
    await cancelOrder(orderId, user.id)
    redirect(
      `/orders/${orderId}?message=${encodeURIComponent('주문이 취소되었습니다.')}`,
    )
  })
}

export async function createProductAction(formData: FormData) {
  await handleCommerceAction('/admin', async () => {
    await requireAdmin()
    const name = getString(formData, 'name')
    const price = Number(getString(formData, 'price'))
    const stock = Number(getString(formData, 'stock'))
    if (!name || name.length > 120)
      throw new CommerceError('상품명은 1~120자로 입력해 주세요.')
    if (!Number.isSafeInteger(price) || price < 0)
      throw new CommerceError('가격은 0 이상의 정수로 입력해 주세요.')
    if (!Number.isSafeInteger(stock) || stock < 0)
      throw new CommerceError('재고는 0 이상의 정수로 입력해 주세요.')
    await connectDB()
    await Product.create({ name, price, stock })
  })
  withMessage('/admin', '상품을 등록했습니다.')
}

export async function createCouponAction(formData: FormData) {
  await handleCommerceAction('/admin', async () => {
    await requireAdmin()
    const email = getString(formData, 'email').toLowerCase()
    const code = getString(formData, 'code').toUpperCase()
    const discount = parsePositiveInteger(
      getString(formData, 'discount'),
      '할인 금액',
    )
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      throw new CommerceError('올바른 회원 이메일을 입력해 주세요.')
    if (!/^[A-Z0-9-]{3,32}$/.test(code))
      throw new CommerceError(
        '쿠폰 코드는 영문, 숫자, 하이픈 3~32자로 입력해 주세요.',
      )
    await connectDB()
    const user = await User.findOne({ email })
    if (!user) throw new CommerceError('해당 이메일의 회원을 찾을 수 없습니다.')
    try {
      await Coupon.create({ userId: user._id, code, discount, used: false })
    } catch (error) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        error.code === 11000
      ) {
        throw new CommerceError('해당 회원에게 이미 발급된 쿠폰 코드입니다.')
      }
      throw error
    }
  })
  withMessage('/admin', '쿠폰을 발급했습니다.')
}

export async function changeOrderStatusAction(formData: FormData) {
  await handleCommerceAction('/admin', async () => {
    await requireAdmin()
    const orderId = getString(formData, 'orderId')
    const from = getString(formData, 'from')
    const to = getString(formData, 'to')
    if (!/^[a-f\d]{24}$/i.test(orderId))
      throw new CommerceError('주문을 찾을 수 없습니다.')
    await changeOrderStatus(orderId, from, to)
  })
  withMessage('/admin', '주문 상태를 변경했습니다.')
}
