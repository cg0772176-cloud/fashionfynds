import { db } from './index';
import { categories, brands, products } from './schema';

async function seed() {
  console.log('Seeding database...');

  try {
    // 1. Seed Categories
    console.log('Seeding categories...');
    const catData = [
      { name: 'Men', slug: 'men', description: 'Men\'s fashion', image: 'https://images.unsplash.com/photo-1516257984-b1b4d707412e?w=800&q=80', createdAt: new Date().toISOString() },
      { name: 'Women', slug: 'women', description: 'Women\'s fashion', image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800&q=80', createdAt: new Date().toISOString() },
      { name: 'Accessories', slug: 'accessories', description: 'Bags, watches, and more', image: 'https://images.unsplash.com/photo-1523206489230-c012c64b2b48?w=800&q=80', createdAt: new Date().toISOString() },
      { name: 'Electronics', slug: 'electronics', description: 'Gadgets and gear', image: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=800&q=80', createdAt: new Date().toISOString() },
    ];

    let insertedCats = [];
    for (const cat of catData) {
      const result = await db.insert(categories).values(cat).returning();
      insertedCats.push(result[0]);
    }

    // 2. Seed Brands
    console.log('Seeding brands...');
    const brandData = [
      { name: 'Nike', slug: 'nike', description: 'Just Do It', logo: 'https://upload.wikimedia.org/wikipedia/commons/a/a6/Logo_NIKE.svg', createdAt: new Date().toISOString() },
      { name: 'Apple', slug: 'apple', description: 'Think Different', logo: 'https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg', createdAt: new Date().toISOString() },
      { name: 'Adidas', slug: 'adidas', description: 'Impossible is Nothing', logo: 'https://upload.wikimedia.org/wikipedia/commons/2/20/Adidas_Logo.svg', createdAt: new Date().toISOString() },
    ];

    let insertedBrands = [];
    for (const brand of brandData) {
      const result = await db.insert(brands).values(brand).returning();
      insertedBrands.push(result[0]);
    }

    // 3. Seed Products
    console.log('Seeding products...');
    const productData = [
      {
        name: 'Nike Air Max 270',
        slug: 'nike-air-max-270',
        brandId: insertedBrands[0].id,
        categoryId: insertedCats[0].id,
        price: 150.00,
        originalPrice: 160.00,
        description: 'Nike\'s first lifestyle Air Max brings you style, comfort and big attitude.',
        image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80',
        images: ['https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80'],
        sizes: ['US 8', 'US 9', 'US 10', 'US 11'],
        colors: ['Red', 'Black', 'White'],
        rating: 4.8,
        reviews: 320,
        inStock: true,
        featured: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        name: 'Apple AirPods Pro',
        slug: 'apple-airpods-pro',
        brandId: insertedBrands[1].id,
        categoryId: insertedCats[3].id,
        price: 249.99,
        originalPrice: 249.99,
        description: 'Active Noise Cancellation for immersive sound.',
        image: 'https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=800&q=80',
        images: ['https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=800&q=80'],
        sizes: ['One Size'],
        colors: ['White'],
        rating: 4.9,
        reviews: 512,
        inStock: true,
        featured: true,
        deal: true,
        dealDiscount: 10,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        name: 'Adidas Ultraboost 22',
        slug: 'adidas-ultraboost-22',
        brandId: insertedBrands[2].id,
        categoryId: insertedCats[1].id,
        price: 190.00,
        originalPrice: 200.00,
        description: 'Comfortable and responsive running shoes.',
        image: 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=800&q=80',
        images: ['https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=800&q=80'],
        sizes: ['US 6', 'US 7', 'US 8'],
        colors: ['Black', 'Grey'],
        rating: 4.7,
        reviews: 128,
        inStock: true,
        featured: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    for (const product of productData) {
      await db.insert(products).values(product);
    }

    console.log('Seeding completed successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seed();
