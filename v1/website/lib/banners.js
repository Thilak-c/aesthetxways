import { getDb } from './mongodb';

export async function getBanners() {
  try {
    const db = await getDb();
    const banners = await db.collection('banners').find({}).toArray();
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
    console.warn('Failed to fetch banners from MongoDB, falling back to empty list:', error.message);
    return [];
  }
}
