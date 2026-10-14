import prisma from '../config/db.js';

// --- PUBLIC APIs ---

export const getPublicServices = async (req, res, next) => {
  try {
    const services = await prisma.shopService.findMany({
      where: { isPublished: true },
      orderBy: { sortOrder: 'asc' },
    });

    return res.status(200).json({
      success: true,
      data: services,
    });
  } catch (error) {
    next(error);
  }
};

// --- ADMIN APIs ---

export const getAdminServices = async (req, res, next) => {
  try {
    const services = await prisma.shopService.findMany({
      orderBy: { sortOrder: 'asc' },
    });

    return res.status(200).json({
      success: true,
      data: services,
    });
  } catch (error) {
    next(error);
  }
};

export const createService = async (req, res, next) => {
  try {
    const { title, description, iconName, imageUrl, isPublished = true, sortOrder = 0 } = req.body;

    if (!title || !description) {
      return res.status(400).json({
        success: false,
        message: 'Service title and description are required.',
      });
    }

    const created = await prisma.shopService.create({
      data: {
        title: title.trim(),
        description: description.trim(),
        iconName: iconName || 'Sparkles',
        imageUrl: imageUrl || null,
        isPublished: Boolean(isPublished),
        sortOrder: parseInt(sortOrder, 10) || 0,
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Service created successfully.',
      data: created,
    });
  } catch (error) {
    next(error);
  }
};

export const updateService = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, description, iconName, imageUrl, isPublished, sortOrder } = req.body;

    const existing = await prisma.shopService.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Service not found.',
      });
    }

    const updateData = {};
    if (title) updateData.title = title.trim();
    if (description) updateData.description = description.trim();
    if (iconName !== undefined) updateData.iconName = iconName;
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl || null;
    if (isPublished !== undefined) updateData.isPublished = Boolean(isPublished);
    if (sortOrder !== undefined) updateData.sortOrder = parseInt(sortOrder, 10);

    const updated = await prisma.shopService.update({
      where: { id },
      data: updateData,
    });

    return res.status(200).json({
      success: true,
      message: 'Service updated successfully.',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteService = async (req, res, next) => {
  try {
    const { id } = req.params;

    await prisma.shopService.delete({
      where: { id },
    });

    return res.status(200).json({
      success: true,
      message: 'Service deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};

export const updateServiceStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { isPublished } = req.body;

    const updated = await prisma.shopService.update({
      where: { id },
      data: { isPublished: Boolean(isPublished) },
    });

    return res.status(200).json({
      success: true,
      message: `Service publication status updated.`,
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};
