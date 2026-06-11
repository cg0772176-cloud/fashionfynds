import { sqliteTable, integer, text, real } from 'drizzle-orm/sqlite-core';



// Auth tables for better-auth
export const user = sqliteTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: integer("email_verified", { mode: "boolean" })
    .$defaultFn(() => false)
    .notNull(),
  image: text("image"),
  role: text("role").notNull().default("user"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
  banned: integer("banned", { mode: "boolean" }).default(false),
  banReason: text("ban_reason"),
  banExpires: integer("ban_expires", { mode: "timestamp" }),
});

export const session = sqliteTable("session", {
  id: text("id").primaryKey(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  token: text("token").notNull().unique(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = sqliteTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: integer("access_token_expires_at", {
    mode: "timestamp",
  }),
  refreshTokenExpiresAt: integer("refresh_token_expires_at", {
    mode: "timestamp",
  }),
  scope: text("scope"),
  password: text("password"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const verification = sqliteTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(
    () => new Date(),
  ),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(
    () => new Date(),
  ),
});

// E-commerce tables
export const categories = sqliteTable('categories', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  description: text('description'),
  image: text('image'),
  createdAt: text('created_at').notNull(),
});

export const brands = sqliteTable('brands', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  ownerId: text('owner_id').references(() => user.id),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  description: text('description'),
  logo: text('logo'),
  subscriptionTier: text('subscription_tier').default('basic'),
  subscriptionExpiresAt: text('subscription_expires_at'),
  commissionRate: real('commission_rate').default(15.0),
  status: text('status').default('pending'),
  createdAt: text('created_at').notNull(),
});

export const products = sqliteTable('products', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  brandId: integer('brand_id').references(() => brands.id),
  categoryId: integer('category_id').references(() => categories.id),
  price: real('price').notNull(),
  originalPrice: real('original_price'),
  description: text('description'),
  image: text('image').notNull(),
  images: text('images', { mode: 'json' }),
  sizes: text('sizes', { mode: 'json' }),
  colors: text('colors', { mode: 'json' }),
  rating: real('rating').default(0),
  reviews: integer('reviews').default(0),
  inStock: integer('in_stock', { mode: 'boolean' }).default(true),
  featured: integer('featured', { mode: 'boolean' }).default(false),
  deal: integer('deal', { mode: 'boolean' }).default(false),
  dealDiscount: integer('deal_discount'),
  dealEndsAt: text('deal_ends_at'),
  movement: text('movement'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const cartItems = sqliteTable('cart_items', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  productId: integer('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  quantity: integer('quantity').notNull(),
  selectedSize: text('selected_size').notNull(),
  selectedColor: text('selected_color').notNull(),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const wishlistItems = sqliteTable('wishlist_items', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  productId: integer('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  createdAt: text('created_at').notNull(),
});

export const orders = sqliteTable('orders', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: text('user_id').notNull().references(() => user.id),
  orderNumber: text('order_number').notNull().unique(),
  status: text('status').notNull().default('pending'),
  subtotal: real('subtotal').notNull(),
  shipping: real('shipping').notNull(),
  tax: real('tax').notNull(),
  total: real('total').notNull(),
  shippingName: text('shipping_name').notNull(),
  shippingEmail: text('shipping_email').notNull(),
  shippingPhone: text('shipping_phone').notNull(),
  shippingAddress: text('shipping_address').notNull(),
  shippingCity: text('shipping_city').notNull(),
  shippingState: text('shipping_state').notNull(),
  shippingZip: text('shipping_zip').notNull(),
  shippingCountry: text('shipping_country').notNull(),
  paymentMethod: text('payment_method').notNull(),
  paymentScreenshot: text('payment_screenshot'),
  razorpayOrderId: text('razorpay_order_id'),
  razorpayPaymentId: text('razorpay_payment_id'),
  razorpaySignature: text('razorpay_signature'),
  // Shiprocket logistics fields
  shiprocketOrderId: text('shiprocket_order_id'),
  shiprocketShipmentId: text('shiprocket_shipment_id'),
  awbCode: text('awb_code'),
  courierName: text('courier_name'),
  trackingUrl: text('tracking_url'),
  shippingLabelUrl: text('shipping_label_url'),
  estimatedDelivery: text('estimated_delivery'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const orderItems = sqliteTable('order_items', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  orderId: integer('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
  productId: integer('product_id').references(() => products.id),
  productName: text('product_name').notNull(),
  productImage: text('product_image').notNull(),
  quantity: integer('quantity').notNull(),
  price: real('price').notNull(),
  selectedSize: text('selected_size').notNull(),
  selectedColor: text('selected_color').notNull(),
  createdAt: text('created_at').notNull(),
});

// Blog posts table
export const blogPosts = sqliteTable('blog_posts', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  slug: text('slug').notNull().unique(),
  excerpt: text('excerpt').notNull(),
  content: text('content').notNull(),
  category: text('category').notNull(),
  authorId: text('author_id').notNull().references(() => user.id),
  authorName: text('author_name').notNull(),
  featured: integer('featured', { mode: 'boolean' }).default(false),
  readTime: text('read_time').notNull(),
  image: text('image').notNull(),
  views: integer('views').default(0),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// Partner applications table
export const partnerApplications = sqliteTable('partner_applications', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  brandName: text('brand_name').notNull(),
  contactName: text('contact_name').notNull(),
  email: text('email').notNull(),
  phone: text('phone').notNull(),
  website: text('website'),
  category: text('category').notNull(),
  description: text('description').notNull(),
  instagram: text('instagram'),
  productsCount: text('products_count'),
  established: text('established'),
  status: text('status').notNull().default('pending'), // pending | approved | rejected
  adminNotes: text('admin_notes'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// Contact form messages
export const contactMessages = sqliteTable('contact_messages', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  email: text('email').notNull(),
  subject: text('subject').notNull(),
  message: text('message').notNull(),
  status: text('status').notNull().default('unread'), // unread | read | replied
  createdAt: text('created_at').notNull(),
});

// Newsletter subscribers
export const newsletterSubscribers = sqliteTable('newsletter_subscribers', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  email: text('email').notNull().unique(),
  source: text('source').default('footer'), // footer | popup | etc.
  active: integer('active', { mode: 'boolean' }).default(true),
  createdAt: text('created_at').notNull(),
});

// Brand stories table
export const brandStories = sqliteTable('brand_stories', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  brandId: integer('brand_id').notNull().references(() => brands.id, { onDelete: 'cascade' }),
  mediaUrl: text('media_url').notNull(),
  expiresAt: text('expires_at').notNull(),
  createdAt: text('created_at').notNull(),
});

export const marketingPayments = sqliteTable('marketing_payments', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  brandId: integer('brand_id').notNull().references(() => brands.id, { onDelete: 'cascade' }),
  amount: real('amount').notNull(),
  status: text('status').notNull().default('pending'), // pending | completed | failed
  razorpayOrderId: text('razorpay_order_id'),
  razorpayPaymentId: text('razorpay_payment_id'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const payouts = sqliteTable('payouts', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  brandId: integer('brand_id').notNull().references(() => brands.id, { onDelete: 'cascade' }),
  orderId: integer('order_id').notNull().references(() => orders.id),
  amountDue: real('amount_due').notNull(),
  commissionTaken: real('commission_taken').notNull(),
  status: text('status').notNull().default('held'), // 'held' | 'ready_for_payout' | 'paid'
  payoutDate: text('payout_date').notNull(), // T+7 days from order delivery
  settledAt: text('settled_at'), // When the admin actually paid the brand
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});