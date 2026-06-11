import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://fashionfynds.com';
  const currentDate = new Date().toISOString().split('T')[0];

  const staticPages = [
    { url: '/', priority: '1.0', changefreq: 'daily' },
    { url: '/deals', priority: '0.9', changefreq: 'daily' },
    { url: '/collections', priority: '0.8', changefreq: 'weekly' },
    { url: '/explore-brands', priority: '0.8', changefreq: 'weekly' },
    { url: '/about', priority: '0.6', changefreq: 'monthly' },
    { url: '/contact', priority: '0.6', changefreq: 'monthly' },
    { url: '/faq', priority: '0.5', changefreq: 'monthly' },
    { url: '/shipping', priority: '0.5', changefreq: 'monthly' },
    { url: '/terms', priority: '0.4', changefreq: 'yearly' },
    { url: '/privacy', priority: '0.4', changefreq: 'yearly' },
  ];

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

  for (const page of staticPages) {
    xml += `
  <url>
    <loc>${baseUrl}${page.url}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`;
  }

  // Try to fetch dynamic data from database, but don't crash if unavailable
  try {
    const { db } = await import('@/db');
    const { products, categories, brands, blogPosts } = await import('@/db/schema');

    const [allProducts, allCategories, allBrands, allBlogPosts] = await Promise.all([
      db.select({ slug: products.slug, updatedAt: products.updatedAt }).from(products).catch(() => []),
      db.select({ slug: categories.slug }).from(categories).catch(() => []),
      db.select({ slug: brands.slug }).from(brands).catch(() => []),
      db.select({ slug: blogPosts.slug, updatedAt: blogPosts.updatedAt }).from(blogPosts).catch(() => []),
    ]);

    for (const product of allProducts) {
      xml += `
  <url>
    <loc>${baseUrl}/products/${product.slug}</loc>
    <lastmod>${product.updatedAt?.split('T')[0] || currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
    }

    for (const category of allCategories) {
      xml += `
  <url>
    <loc>${baseUrl}/categories/${category.slug}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`;
    }

    for (const brand of allBrands) {
      xml += `
  <url>
    <loc>${baseUrl}/brands/${brand.slug}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`;
    }

    for (const post of allBlogPosts) {
      xml += `
  <url>
    <loc>${baseUrl}/blog/${post.slug}</loc>
    <lastmod>${post.updatedAt?.split('T')[0] || currentDate}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`;
    }
  } catch (error) {
    console.warn('Sitemap: Could not fetch dynamic data from database:', error);
  }

  xml += `
</urlset>`;

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}
