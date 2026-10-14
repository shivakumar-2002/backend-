import prisma from '../config/db.js';

export const getDashboardStats = async (req, res, next) => {
  try {
    const [
      totalProducts,
      publishedProducts,
      draftProducts,
      totalCategories,
      newEnquiries,
      totalEnquiries,
      recentEnquiries,
      recentProducts,
    ] = await Promise.all([
      prisma.product.count(),
      prisma.product.count({ where: { publicationStatus: 'PUBLISHED' } }),
      prisma.product.count({ where: { publicationStatus: 'DRAFT' } }),
      prisma.category.count(),
      prisma.customerEnquiry.count({ where: { status: 'NEW' } }),
      prisma.customerEnquiry.count(),
      prisma.customerEnquiry.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          product: {
            select: { id: true, name: true },
          },
        },
      }),
      prisma.product.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          category: { select: { name: true } },
          images: { take: 1, orderBy: { sortOrder: 'asc' } },
        },
      }),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        stats: {
          totalProducts,
          publishedProducts,
          draftProducts,
          totalCategories,
          newEnquiries,
          totalEnquiries,
        },
        recentEnquiries,
        recentProducts,
      },
    });
  } catch (error) {
    next(error);
  }
};
