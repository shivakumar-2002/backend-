import prisma from '../config/db.js';
import { slugify } from '../utils/slugify.js';
import { deleteImageFromStorage } from '../config/cloudinary.js';

// --- PUBLIC APIs ---

export const getPublicProducts = async (req, res, next) => {
  try {
    const { category, search, purity, metal, featured, newArrival, sort } = req.query;

    const where = {
      publicationStatus: 'PUBLISHED',
    };

    if (category) {
      where.OR = [
        { category: { slug: category } },
        { categoryId: category },
      ];
    }

    if (search) {
      where.AND = [
        ...(where.AND || []),
        {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
          ],
        },
      ];
    }

    const targetMetal = (metal || purity || '').trim().toUpperCase();
    if (targetMetal === 'GOLD') {
      where.AND = [
        ...(where.AND || []),
        {
          OR: [
            { metalType: 'GOLD' },
            { purity: { contains: 'Gold', mode: 'insensitive' } },
            { purity: { contains: '22K', mode: 'insensitive' } },
            { purity: { contains: '18K', mode: 'insensitive' } },
            { purity: { contains: '24K', mode: 'insensitive' } },
            { purity: { contains: 'KDM', mode: 'insensitive' } },
          ],
        },
      ];
    } else if (targetMetal === 'SILVER') {
      where.AND = [
        ...(where.AND || []),
        {
          OR: [
            { metalType: 'SILVER' },
            { purity: { contains: 'Silver', mode: 'insensitive' } },
            { purity: { contains: '925', mode: 'insensitive' } },
          ],
        },
      ];
    } else if (purity) {
      where.purity = { contains: purity, mode: 'insensitive' };
    }

    if (featured === 'true') {
      where.isFeatured = true;
    }

    if (newArrival === 'true') {
      where.isNewArrival = true;
    }

    let orderBy = [{ isFeatured: 'desc' }, { createdAt: 'desc' }];
    if (sort === 'name-asc') {
      orderBy = [{ name: 'asc' }];
    } else if (sort === 'name-desc') {
      orderBy = [{ name: 'desc' }];
    } else if (sort === 'newest') {
      orderBy = [{ createdAt: 'desc' }];
    }

    const products = await prisma.product.findMany({
      where,
      orderBy,
      include: {
        category: {
          select: { id: true, name: true, slug: true },
        },
        images: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    return res.status(200).json({
      success: true,
      count: products.length,
      data: products,
    });
  } catch (error) {
    next(error);
  }
};

export const getPublicProductById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const product = await prisma.product.findFirst({
      where: {
        publicationStatus: 'PUBLISHED',
        OR: [{ id: id }, { slug: id }],
      },
      include: {
        category: true,
        images: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Jewellery product not found or unavailable.',
      });
    }

    // Related products in the same category
    const relatedProducts = await prisma.product.findMany({
      where: {
        publicationStatus: 'PUBLISHED',
        categoryId: product.categoryId,
        id: { not: product.id },
      },
      take: 4,
      include: {
        category: true,
        images: {
          orderBy: { sortOrder: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.status(200).json({
      success: true,
      data: product,
      related: relatedProducts,
    });
  } catch (error) {
    next(error);
  }
};

// --- ADMIN APIs ---

export const getAdminProducts = async (req, res, next) => {
  try {
    const { search, category, status, featured, page = 1, limit = 50 } = req.query;

    const where = {};

    if (status && status !== 'ALL') {
      where.publicationStatus = status;
    }

    if (category && category !== 'ALL') {
      where.categoryId = category;
    }

    if (featured === 'true') {
      where.isFeatured = true;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { purity: { contains: search, mode: 'insensitive' } },
      ];
    }

    const take = parseInt(limit, 10);
    const skip = (parseInt(page, 10) - 1) * take;

    const [total, products] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        take,
        skip,
        orderBy: { createdAt: 'desc' },
        include: {
          category: {
            select: { id: true, name: true, slug: true },
          },
          images: {
            orderBy: { sortOrder: 'asc' },
          },
        },
      }),
    ]);

    return res.status(200).json({
      success: true,
      total,
      page: parseInt(page, 10),
      totalPages: Math.ceil(total / take),
      data: products,
    });
  } catch (error) {
    next(error);
  }
};

export const getAdminProductById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        images: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found.',
      });
    }

    return res.status(200).json({
      success: true,
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

// Helper to resolve category by ID or typed name (auto-creating if new)
async function resolveCategory(categoryIdOrName) {
  if (!categoryIdOrName) return null;
  const val = String(categoryIdOrName).trim();
  if (!val) return null;

  // 1. Try finding by ID
  try {
    const catById = await prisma.category.findUnique({ where: { id: val } });
    if (catById) return catById.id;
  } catch {
    // If not a valid UUID or id format, fall through
  }

  // 2. Try finding by name (case-insensitive)
  const catByName = await prisma.category.findFirst({
    where: { name: { equals: val, mode: 'insensitive' } },
  });
  if (catByName) return catByName.id;

  // 3. Auto-create new category with this typed name
  const baseSlug = slugify(val) || 'category';
  let finalSlug = baseSlug;
  let counter = 1;
  while (await prisma.category.findUnique({ where: { slug: finalSlug } })) {
    finalSlug = `${baseSlug}-${counter++}`;
  }

  const created = await prisma.category.create({
    data: {
      name: val,
      slug: finalSlug,
      isActive: true,
      sortOrder: 0,
    },
  });
  return created.id;
}

export const createProduct = async (req, res, next) => {
  try {
    const {
      name,
      description,
      categoryId,
      categoryName,
      metalType = 'GOLD',
      purity,
      weight,
      price,
      availabilityStatus = 'IN_STOCK',
      publicationStatus = 'PUBLISHED',
      isFeatured = false,
      isNewArrival = false,
      images = [],
    } = req.body;

    const rawCategory = categoryId || categoryName;
    if (!name || !rawCategory) {
      return res.status(400).json({
        success: false,
        message: 'Product name and category are required.',
      });
    }

    const resolvedCategoryId = await resolveCategory(rawCategory);
    if (!resolvedCategoryId) {
      return res.status(400).json({
        success: false,
        message: 'Invalid jewellery category.',
      });
    }

    // Generate unique slug
    let baseSlug = slugify(name);
    let finalSlug = baseSlug;
    let counter = 1;
    while (await prisma.product.findUnique({ where: { slug: finalSlug } })) {
      finalSlug = `${baseSlug}-${counter++}`;
    }

    const created = await prisma.product.create({
      data: {
        name: name.trim(),
        slug: finalSlug,
        description: description ? description.trim() : null,
        categoryId: resolvedCategoryId,
        metalType: metalType?.toUpperCase() === 'SILVER' ? 'SILVER' : 'GOLD',
        purity: purity ? purity.trim() : null,
        weight: weight !== undefined && weight !== null && weight !== '' ? parseFloat(weight) : null,
        price: price !== undefined && price !== null && price !== '' ? parseFloat(price) : null,
        availabilityStatus,
        publicationStatus,
        isFeatured: Boolean(isFeatured),
        isNewArrival: Boolean(isNewArrival),
        images: {
          create: images.map((img, idx) => ({
            imageUrl: img.imageUrl,
            publicId: img.publicId || null,
            altText: img.altText || name,
            sortOrder: img.sortOrder !== undefined ? parseInt(img.sortOrder, 10) : idx,
          })),
        },
      },
      include: {
        category: true,
        images: { orderBy: { sortOrder: 'asc' } },
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Jewellery product created successfully.',
      data: created,
    });
  } catch (error) {
    next(error);
  }
};

export const updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      categoryId,
      categoryName,
      metalType,
      purity,
      weight,
      price,
      availabilityStatus,
      publicationStatus,
      isFeatured,
      isNewArrival,
      images,
    } = req.body;

    const existing = await prisma.product.findUnique({
      where: { id },
      include: { images: true },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Product not found.',
      });
    }

    const updateData = {};
    if (name) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description ? description.trim() : null;
    
    const rawCategory = categoryId || categoryName;
    if (rawCategory) {
      const resolvedCatId = await resolveCategory(rawCategory);
      if (resolvedCatId) updateData.categoryId = resolvedCatId;
    }
    if (metalType) updateData.metalType = metalType.toUpperCase() === 'SILVER' ? 'SILVER' : 'GOLD';
    if (purity !== undefined) updateData.purity = purity ? purity.trim() : null;
    if (weight !== undefined) updateData.weight = weight !== null && weight !== '' ? parseFloat(weight) : null;
    if (price !== undefined) updateData.price = price !== null && price !== '' ? parseFloat(price) : null;
    if (availabilityStatus) updateData.availabilityStatus = availabilityStatus;
    if (publicationStatus) updateData.publicationStatus = publicationStatus;
    if (isFeatured !== undefined) updateData.isFeatured = Boolean(isFeatured);
    if (isNewArrival !== undefined) updateData.isNewArrival = Boolean(isNewArrival);

    // Update images if provided
    if (Array.isArray(images)) {
      // Find removed images to delete from Cloudinary/storage
      const newUrls = new Set(images.map((img) => img.imageUrl));
      const removedImages = existing.images.filter((img) => !newUrls.has(img.imageUrl));
      for (const removed of removedImages) {
        if (removed.publicId) {
          deleteImageFromStorage(removed.publicId).catch(() => {});
        }
      }

      await prisma.productImage.deleteMany({
        where: { productId: id },
      });

      updateData.images = {
        create: images.map((img, idx) => ({
          imageUrl: img.imageUrl,
          publicId: img.publicId || null,
          altText: img.altText || updateData.name || existing.name,
          sortOrder: img.sortOrder !== undefined ? parseInt(img.sortOrder, 10) : idx,
        })),
      };
    }

    const updated = await prisma.product.update({
      where: { id },
      data: updateData,
      include: {
        category: true,
        images: { orderBy: { sortOrder: 'asc' } },
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Product updated successfully.',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;

    const product = await prisma.product.findUnique({
      where: { id },
      include: { images: true },
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found.',
      });
    }

    // Clean up images from Cloudinary or local storage
    for (const img of product.images) {
      if (img.publicId) {
        deleteImageFromStorage(img.publicId).catch(() => {});
      }
    }

    await prisma.product.delete({
      where: { id },
    });

    return res.status(200).json({
      success: true,
      message: 'Jewellery product deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};

export const updateProductStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { publicationStatus } = req.body;

    if (!['PUBLISHED', 'DRAFT'].includes(publicationStatus)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid publication status. Must be PUBLISHED or DRAFT.',
      });
    }

    const updated = await prisma.product.update({
      where: { id },
      data: { publicationStatus },
      select: {
        id: true,
        name: true,
        publicationStatus: true,
      },
    });

    return res.status(200).json({
      success: true,
      message: `Product publication status updated to ${publicationStatus}.`,
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};
