import prisma from '../config/db.js';

export const getPublicShopSettings = async (req, res, next) => {
  try {
    let settings = await prisma.shopSettings.findFirst();

    if (!settings) {
      settings = await prisma.shopSettings.create({
        data: {
          shopName: 'HARI HARA Jewellery Works',
          tagline: 'We Make All Types of Gold & Silver Ornaments in 91.6 KDM Hall Marke With Guarantee',
          aboutText: 'Trusted goldsmiths and ornament makers since 2001 in Uppuguda, Hyderabad.',
          heroDescription: 'Over 25 years of master craftsmanship in 91.6 KDM hallmarked gold ornaments.',
        },
      });
    }

    return res.status(200).json({
      success: true,
      data: settings,
    });
  } catch (error) {
    next(error);
  }
};

export const getAdminShopSettings = async (req, res, next) => {
  try {
    let settings = await prisma.shopSettings.findFirst();

    if (!settings) {
      settings = await prisma.shopSettings.create({
        data: {
          shopName: 'HARI HARA Jewellery Works',
          aboutText: 'Handcrafted gold and silver jewellery.',
          heroDescription: 'Experience divine Indian jewellery craftsmanship.',
        },
      });
    }

    return res.status(200).json({
      success: true,
      data: settings,
    });
  } catch (error) {
    next(error);
  }
};

export const updateShopSettings = async (req, res, next) => {
  try {
    const {
      shopName,
      tagline,
      logoUrl,
      address,
      phone,
      whatsappNumber,
      email,
      openingHours,
      mapUrl,
      mapEmbedUrl,
      aboutText,
      heroTitle,
      heroDescription,
      heroImageUrl,
      footerText,
      socialInstagram,
      socialFacebook,
      socialYoutube,
      hallmarkInfo,
      returnPolicy,
      customOrderPolicy,
      goldRate22k,
      goldRate24k,
      silverRate1g,
    } = req.body;

    let settings = await prisma.shopSettings.findFirst();

    const dataPayload = {
      ...(shopName !== undefined && { shopName: shopName.trim() }),
      ...(tagline !== undefined && { tagline: tagline?.trim() }),
      ...(logoUrl !== undefined && { logoUrl }),
      ...(address !== undefined && { address: address.trim() }),
      ...(phone !== undefined && { phone: phone.trim() }),
      ...(whatsappNumber !== undefined && { whatsappNumber: whatsappNumber.trim() }),
      ...(email !== undefined && { email: email?.trim() }),
      ...(openingHours !== undefined && { openingHours: openingHours.trim() }),
      ...(mapUrl !== undefined && { mapUrl }),
      ...(mapEmbedUrl !== undefined && { mapEmbedUrl }),
      ...(aboutText !== undefined && { aboutText }),
      ...(heroTitle !== undefined && { heroTitle: heroTitle.trim() }),
      ...(heroDescription !== undefined && { heroDescription }),
      ...(heroImageUrl !== undefined && { heroImageUrl }),
      ...(footerText !== undefined && { footerText: footerText.trim() }),
      ...(socialInstagram !== undefined && { socialInstagram }),
      ...(socialFacebook !== undefined && { socialFacebook }),
      ...(socialYoutube !== undefined && { socialYoutube }),
      ...(hallmarkInfo !== undefined && { hallmarkInfo }),
      ...(returnPolicy !== undefined && { returnPolicy }),
      ...(customOrderPolicy !== undefined && { customOrderPolicy }),
      ...(goldRate22k !== undefined && { goldRate22k: goldRate22k ? parseFloat(goldRate22k) : null }),
      ...(goldRate24k !== undefined && { goldRate24k: goldRate24k ? parseFloat(goldRate24k) : null }),
      ...(silverRate1g !== undefined && { silverRate1g: silverRate1g ? parseFloat(silverRate1g) : null }),
    };

    if (settings) {
      settings = await prisma.shopSettings.update({
        where: { id: settings.id },
        data: dataPayload,
      });
    } else {
      settings = await prisma.shopSettings.create({
        data: {
          aboutText: aboutText || 'About HARI HARA Jewellery Works',
          heroDescription: heroDescription || 'Gold & Silver Craftsmanship',
          ...dataPayload,
        },
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Shop settings updated successfully.',
      data: settings,
    });
  } catch (error) {
    next(error);
  }
};
