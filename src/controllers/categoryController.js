import prisma from '../config/db.js';
import { slugify } from '../utils/slugify.js';

// --- PUBLIC APIs ---

export const getPublicCategories = async (req, res, next) => {
  try {
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      include: {
        _count: {
          select: {
            products: {
              where: { publicationStatus: 'PUBLISHED' },
            },
          },
        },
      },
    });

    const formatted = categories.map((c) => ({
      ...c,
      productCount: c._count.products,
    }));

    return res.status(200).json({
      success: true,
      data: formatted,
    });
  } catch (error) {
    next(error);
  }
};

export const getCategoryProducts = async (req, res, next) => {
  try {
    const { slug } = req.params;

    const category = await prisma.category.findUnique({
      where: { slug },
      include: {
        products: {
          where: { publicationStatus: 'PUBLISHED' },
          include: {
            images: { orderBy: { sortOrder: 'asc' } },
          },
          orderBy: [{ isFeatured: 'desc' }, { createdAt: 'desc' }],
        },
      },
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found.',
      });
    }

    return res.status(200).json({
      success: true,
      category: {
        id: category.id,
        name: category.name,
        slug: category.slug,
        description: category.description,
        imageUrl: category.imageUrl,
      },
      data: category.products,
    });
  } catch (error) {
    next(error);
  }
};

// --- ADMIN APIs ---

export const getAdminCategories = async (req, res, next) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { sortOrder: 'asc' },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    const formatted = categories.map((c) => ({
      ...c,
      productCount: c._count.products,
    }));

    return res.status(200).json({
      success: true,
      data: formatted,
    });
  } catch (error) {
    next(error);
  }
};

export const createCategory = async (req, res, next) => {
  try {
    const { name, description, imageUrl, isActive = true, sortOrder = 0 } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Category name is required.',
      });
    }

    let baseSlug = slugify(name);
    let finalSlug = baseSlug;
    let counter = 1;
    while (await prisma.category.findUnique({ where: { slug: finalSlug } })) {
      finalSlug = `${baseSlug}-${counter++}`;
    }

    const created = await prisma.category.create({
      data: {
        name: name.trim(),
        slug: finalSlug,
        description: description ? description.trim() : null,
        imageUrl: imageUrl || null,
        isActive: Boolean(isActive),
        sortOrder: parseInt(sortOrder, 10) || 0,
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Category created successfully.',
      data: created,
    });
  } catch (error) {
    next(error);
  }
};

export const updateCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, imageUrl, isActive, sortOrder } = req.body;

    const existing = await prisma.category.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Category not found.',
      });
    }

    const updateData = {};
    if (name) {
      updateData.name = name.trim();
      // Keep slug if not conflicting
    }
    if (description !== undefined) updateData.description = description ? description.trim() : null;
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl || null;
    if (isActive !== undefined) updateData.isActive = Boolean(isActive);
    if (sortOrder !== undefined) updateData.sortOrder = parseInt(sortOrder, 10);

    const updated = await prisma.category.update({
      where: { id },
      data: updateData,
    });

    return res.status(200).json({
      success: true,
      message: 'Category updated successfully.',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteCategory = async (req, res, next) => {
  try {
    const { id } = req.params;

    const productCount = await prisma.product.count({
      where: { categoryId: id },
    });

    if (productCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete this category because ${productCount} product(s) are currently assigned to it. Please reassign or delete the products first.`,
      });
    }

    await prisma.category.delete({
      where: { id },
    });

    return res.status(200).json({
      success: true,
      message: 'Category deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};
