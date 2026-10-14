import prisma from '../config/db.js';
import { uploadImageToStorage } from '../config/cloudinary.js';

// --- PUBLIC ENQUIRY SUBMISSION ---

export const createEnquiry = async (req, res, next) => {
  try {
    const { customerName, phone, email, productId, message, queryType, targetWeight, website_check } = req.body;

    // Honeypot spam trap
    if (website_check) {
      // Pretend success to silent spammers
      return res.status(200).json({
        success: true,
        message: 'Thank you for your enquiry. We will contact you shortly.',
      });
    }

    if (!customerName || !phone || !message) {
      return res.status(400).json({
        success: false,
        message: 'Please provide your name, phone number, and enquiry message.',
      });
    }

    // Clean phone number
    const cleanPhone = phone.trim();
    if (cleanPhone.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid contact phone number.',
      });
    }

    // Handle optional uploaded image
    let attachedImageUrl = null;
    if (req.file) {
      try {
        const uploadResult = await uploadImageToStorage(req.file);
        attachedImageUrl = uploadResult.imageUrl;
      } catch (uploadErr) {
        console.error('Customer enquiry image upload error:', uploadErr);
      }
    }

    // If productId is passed, ensure it exists
    let validProductId = null;
    if (productId) {
      const prod = await prisma.product.findUnique({
        where: { id: productId },
        select: { id: true },
      });
      if (prod) {
        validProductId = prod.id;
      }
    }

    // Format rich message to save in database
    let fullMessage = message.trim();
    if (queryType) {
      fullMessage = `[Type: ${queryType}] ${fullMessage}`;
    }
    if (targetWeight) {
      fullMessage += `\nTarget Weight / Budget: ${targetWeight}`;
    }
    if (attachedImageUrl) {
      fullMessage += `\nAttached Photo: ${attachedImageUrl}`;
    }

    const enquiry = await prisma.customerEnquiry.create({
      data: {
        customerName: customerName.trim(),
        phone: cleanPhone,
        email: email ? email.trim() : null,
        productId: validProductId,
        message: fullMessage,
        status: 'NEW',
      },
      select: {
        id: true,
        customerName: true,
        createdAt: true,
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Thank you! Your enquiry has been sent to WhatsApp & logged with our workshop.',
      data: { id: enquiry.id, imageUrl: attachedImageUrl },
    });
  } catch (error) {
    next(error);
  }
};

// --- ADMIN ENQUIRY MANAGEMENT ---

export const getAdminEnquiries = async (req, res, next) => {
  try {
    const { status, search, page = 1, limit = 50 } = req.query;

    const where = {};
    if (status && status !== 'ALL') {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { customerName: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { message: { contains: search, mode: 'insensitive' } },
      ];
    }

    const take = parseInt(limit, 10);
    const skip = (parseInt(page, 10) - 1) * take;

    const [total, enquiries] = await Promise.all([
      prisma.customerEnquiry.count({ where }),
      prisma.customerEnquiry.findMany({
        where,
        take,
        skip,
        orderBy: { createdAt: 'desc' },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
              purity: true,
              images: {
                take: 1,
                orderBy: { sortOrder: 'asc' },
              },
            },
          },
        },
      }),
    ]);

    return res.status(200).json({
      success: true,
      total,
      page: parseInt(page, 10),
      totalPages: Math.ceil(total / take),
      data: enquiries,
    });
  } catch (error) {
    next(error);
  }
};

export const getAdminEnquiryById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const enquiry = await prisma.customerEnquiry.findUnique({
      where: { id },
      include: {
        product: {
          include: {
            images: { take: 1, orderBy: { sortOrder: 'asc' } },
          },
        },
      },
    });

    if (!enquiry) {
      return res.status(404).json({
        success: false,
        message: 'Enquiry not found.',
      });
    }

    return res.status(200).json({
      success: true,
      data: enquiry,
    });
  } catch (error) {
    next(error);
  }
};

export const updateEnquiryStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['NEW', 'CONTACTED', 'IN_PROGRESS', 'RESOLVED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
      });
    }

    const updated = await prisma.customerEnquiry.update({
      where: { id },
      data: { status },
    });

    return res.status(200).json({
      success: true,
      message: `Enquiry status updated to ${status}.`,
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

export const updateEnquiryNotes = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { internalNotes } = req.body;

    const updated = await prisma.customerEnquiry.update({
      where: { id },
      data: { internalNotes: internalNotes || null },
    });

    return res.status(200).json({
      success: true,
      message: 'Internal admin notes saved.',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};
