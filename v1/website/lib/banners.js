import { convexClient } from './convex';

export async function getBanners() {
  try {
    const banners = await convexClient.query('banners:getBanners');
    const manageUrl = process.env.NEXT_PUBLIC_INSYS_URL || 'https://manage.aesthetxways.com';
    return (banners || []).map((banner) => {
      let imageUrl = banner.imageUrl;
      if (imageUrl) {
        const idx = imageUrl.indexOf('/api/uploads/');
        if (idx !== -1) {
          imageUrl = `${manageUrl}${imageUrl.substring(idx)}`;
        }
      }
      return { ...banner, imageUrl };
    });
  } catch (error) {
    console.warn('Failed to fetch banners from Convex, falling back to empty list:', error.message);
    return [];
  }
}
