import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { blogPosts, session, user } from '@/db/schema';
import { eq, like, or, and, desc } from 'drizzle-orm';

const slugify = (text: string): string => {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
};

import { getCurrentUser } from '@/lib/auth';

async function authenticateRequest(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return null;
    return { userId: user.id };
  } catch (error) {
    console.error('Authentication error:', error);
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const slug = searchParams.get('slug');
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const featured = searchParams.get('featured');
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '10'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');

    if (id) {
      const parsedId = parseInt(id);
      if (isNaN(parsedId)) {
        return NextResponse.json(
          { error: 'Valid ID is required', code: 'INVALID_FIELD' },
          { status: 400 }
        );
      }

      const result = await db
        .select()
        .from(blogPosts)
        .where(eq(blogPosts.id, parsedId))
        .limit(1);

      if (result.length === 0) {
        return NextResponse.json(
          { error: 'Blog post not found', code: 'NOT_FOUND' },
          { status: 404 }
        );
      }

      return NextResponse.json(result[0], { status: 200 });
    }

    if (slug) {
      const result = await db
        .select()
        .from(blogPosts)
        .where(eq(blogPosts.slug, slug))
        .limit(1);

      if (result.length === 0) {
        return NextResponse.json(
          { error: 'Blog post not found', code: 'NOT_FOUND' },
          { status: 404 }
        );
      }

      return NextResponse.json(result[0], { status: 200 });
    }

    let query = db.select().from(blogPosts);
    const conditions = [];

    if (category) {
      conditions.push(eq(blogPosts.category, category));
    }

    if (featured !== null && featured !== undefined) {
      const featuredBool = featured === 'true';
      conditions.push(eq(blogPosts.featured, featuredBool));
    }

    if (search) {
      conditions.push(
        or(
          like(blogPosts.title, `%${search}%`),
          like(blogPosts.excerpt, `%${search}%`),
          like(blogPosts.content, `%${search}%`)
        )
      );
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const results = await query
      .orderBy(desc(blogPosts.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json(results, { status: 200 });
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message, code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const userSession = await authenticateRequest(request);
    if (!userSession) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const body = await request.json();

    if ('userId' in body || 'authorId' in body || 'authorName' in body) {
      return NextResponse.json(
        {
          error: 'User ID and author information cannot be provided in request body',
          code: 'USER_ID_NOT_ALLOWED',
        },
        { status: 400 }
      );
    }

    const { title, excerpt, content, category, readTime, image, featured } = body;

    if (!title || typeof title !== 'string' || title.trim() === '') {
      return NextResponse.json(
        { error: 'Title is required and must be a non-empty string', code: 'MISSING_REQUIRED_FIELD' },
        { status: 400 }
      );
    }

    if (!excerpt || typeof excerpt !== 'string' || excerpt.trim() === '') {
      return NextResponse.json(
        { error: 'Excerpt is required and must be a non-empty string', code: 'MISSING_REQUIRED_FIELD' },
        { status: 400 }
      );
    }

    if (!content || typeof content !== 'string' || content.trim() === '') {
      return NextResponse.json(
        { error: 'Content is required and must be a non-empty string', code: 'MISSING_REQUIRED_FIELD' },
        { status: 400 }
      );
    }

    if (!category || typeof category !== 'string' || category.trim() === '') {
      return NextResponse.json(
        { error: 'Category is required and must be a non-empty string', code: 'MISSING_REQUIRED_FIELD' },
        { status: 400 }
      );
    }

    if (!readTime || typeof readTime !== 'string' || readTime.trim() === '') {
      return NextResponse.json(
        { error: 'Read time is required and must be a non-empty string', code: 'MISSING_REQUIRED_FIELD' },
        { status: 400 }
      );
    }

    if (!image || typeof image !== 'string' || image.trim() === '') {
      return NextResponse.json(
        { error: 'Image is required and must be a non-empty string', code: 'MISSING_REQUIRED_FIELD' },
        { status: 400 }
      );
    }

    const generatedSlug = slugify(title);

    const existingSlug = await db
      .select()
      .from(blogPosts)
      .where(eq(blogPosts.slug, generatedSlug))
      .limit(1);

    if (existingSlug.length > 0) {
      return NextResponse.json(
        { error: 'A blog post with this title already exists', code: 'DUPLICATE_SLUG' },
        { status: 400 }
      );
    }

    const authorResult = await db
      .select()
      .from(user)
      .where(eq(user.id, userSession.userId))
      .limit(1);

    if (authorResult.length === 0) {
      return NextResponse.json(
        { error: 'User not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    const author = authorResult[0];

    const newPost = await db
      .insert(blogPosts)
      .values({
        title: title.trim(),
        slug: generatedSlug,
        excerpt: excerpt.trim(),
        content: content.trim(),
        category: category.trim(),
        authorId: userSession.userId,
        authorName: author.name,
        featured: featured === true,
        readTime: readTime.trim(),
        image: image.trim(),
        views: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .returning();

    return NextResponse.json(newPost[0], { status: 201 });
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message, code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const userSession = await authenticateRequest(request);
    if (!userSession) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');

    if (!slug) {
      return NextResponse.json(
        { error: 'Slug parameter is required', code: 'MISSING_REQUIRED_FIELD' },
        { status: 400 }
      );
    }

    const existingPost = await db
      .select()
      .from(blogPosts)
      .where(eq(blogPosts.slug, slug))
      .limit(1);

    if (existingPost.length === 0) {
      return NextResponse.json(
        { error: 'Blog post not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    const post = existingPost[0];

    if (post.authorId !== userSession.userId) {
      return NextResponse.json(
        { error: 'You do not have permission to update this blog post', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    const body = await request.json();

    if ('authorId' in body || 'authorName' in body || 'views' in body || 'createdAt' in body) {
      return NextResponse.json(
        {
          error: 'Cannot update authorId, authorName, views, or createdAt',
          code: 'INVALID_FIELD',
        },
        { status: 400 }
      );
    }

    const { title, excerpt, content, category, readTime, image, featured } = body;

    const updates: any = {
      updatedAt: new Date().toISOString(),
    };

    if (title !== undefined) {
      if (typeof title !== 'string' || title.trim() === '') {
        return NextResponse.json(
          { error: 'Title must be a non-empty string', code: 'INVALID_FIELD' },
          { status: 400 }
        );
      }
      updates.title = title.trim();
      const newSlug = slugify(title);

      if (newSlug !== post.slug) {
        const slugCheck = await db
          .select()
          .from(blogPosts)
          .where(and(eq(blogPosts.slug, newSlug), eq(blogPosts.id, post.id)))
          .limit(1);

        const existingSlugCheck = await db
          .select()
          .from(blogPosts)
          .where(eq(blogPosts.slug, newSlug))
          .limit(1);

        if (existingSlugCheck.length > 0 && existingSlugCheck[0].id !== post.id) {
          return NextResponse.json(
            { error: 'A blog post with this title already exists', code: 'DUPLICATE_SLUG' },
            { status: 400 }
          );
        }

        updates.slug = newSlug;
      }
    }

    if (excerpt !== undefined) {
      if (typeof excerpt !== 'string' || excerpt.trim() === '') {
        return NextResponse.json(
          { error: 'Excerpt must be a non-empty string', code: 'INVALID_FIELD' },
          { status: 400 }
        );
      }
      updates.excerpt = excerpt.trim();
    }

    if (content !== undefined) {
      if (typeof content !== 'string' || content.trim() === '') {
        return NextResponse.json(
          { error: 'Content must be a non-empty string', code: 'INVALID_FIELD' },
          { status: 400 }
        );
      }
      updates.content = content.trim();
    }

    if (category !== undefined) {
      if (typeof category !== 'string' || category.trim() === '') {
        return NextResponse.json(
          { error: 'Category must be a non-empty string', code: 'INVALID_FIELD' },
          { status: 400 }
        );
      }
      updates.category = category.trim();
    }

    if (readTime !== undefined) {
      if (typeof readTime !== 'string' || readTime.trim() === '') {
        return NextResponse.json(
          { error: 'Read time must be a non-empty string', code: 'INVALID_FIELD' },
          { status: 400 }
        );
      }
      updates.readTime = readTime.trim();
    }

    if (image !== undefined) {
      if (typeof image !== 'string' || image.trim() === '') {
        return NextResponse.json(
          { error: 'Image must be a non-empty string', code: 'INVALID_FIELD' },
          { status: 400 }
        );
      }
      updates.image = image.trim();
    }

    if (featured !== undefined) {
      updates.featured = featured === true;
    }

    const updated = await db
      .update(blogPosts)
      .set(updates)
      .where(and(eq(blogPosts.id, post.id), eq(blogPosts.authorId, userSession.userId)))
      .returning();

    if (updated.length === 0) {
      return NextResponse.json(
        { error: 'Failed to update blog post', code: 'INTERNAL_ERROR' },
        { status: 500 }
      );
    }

    return NextResponse.json(updated[0], { status: 200 });
  } catch (error) {
    console.error('PUT error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message, code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const userSession = await authenticateRequest(request);
    if (!userSession) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');

    if (!slug) {
      return NextResponse.json(
        { error: 'Slug parameter is required', code: 'MISSING_REQUIRED_FIELD' },
        { status: 400 }
      );
    }

    const existingPost = await db
      .select()
      .from(blogPosts)
      .where(eq(blogPosts.slug, slug))
      .limit(1);

    if (existingPost.length === 0) {
      return NextResponse.json(
        { error: 'Blog post not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    const post = existingPost[0];

    if (post.authorId !== userSession.userId) {
      return NextResponse.json(
        { error: 'You do not have permission to delete this blog post', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    const deleted = await db
      .delete(blogPosts)
      .where(and(eq(blogPosts.id, post.id), eq(blogPosts.authorId, userSession.userId)))
      .returning();

    if (deleted.length === 0) {
      return NextResponse.json(
        { error: 'Failed to delete blog post', code: 'INTERNAL_ERROR' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        message: 'Blog post deleted successfully',
        deletedPost: deleted[0],
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message, code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}