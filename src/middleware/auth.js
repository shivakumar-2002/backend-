import jwt from 'jsonwebtoken';
import prisma from '../config/db.js';

export const requireAdmin = async (req, res, next) => {
  try {
    let token = null;

    // 1. Check HTTP-only cookie
    if (req.cookies && req.cookies.admin_token) {
      token = req.cookies.admin_token;
    }

    // 2. Fallback to Authorization Header (Bearer <token>)
    if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please log in as an administrator.',
      });
    }

    const secret = process.env.JWT_SECRET || 'fallback-secret-key';
    const decoded = jwt.verify(token, secret);

    const adminUser = await prisma.adminUser.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    if (!adminUser) {
      return res.status(401).json({
        success: false,
        message: 'Invalid session or user no longer exists.',
      });
    }

    req.user = adminUser;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Your session has expired. Please log in again.',
      });
    }
    return res.status(401).json({
      success: false,
      message: 'Invalid authorization token.',
    });
  }
};
