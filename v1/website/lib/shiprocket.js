// Shiprocket API Client & Real-time Serviceability Engine for Aesthetx Ways
let cachedToken = null;
let tokenExpiry = null;

export async function getShiprocketToken() {
  if (cachedToken && tokenExpiry && Date.now() < tokenExpiry) {
    return cachedToken;
  }

  const base = process.env.SHIPROCKET_BASE_URL || 'https://apiv2.shiprocket.in/v1/external';
  const email = process.env.SHIPROCKET_EMAIL;
  const password = process.env.SHIPROCKET_PASSWORD;

  if (!email || !password) {
    throw new Error('Shiprocket credentials not configured in environment');
  }

  const res = await fetch(`${base}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  const data = await res.json();
  if (!res.ok || !data.token) {
    throw new Error(data.message || 'Failed to authenticate with Shiprocket');
  }

  cachedToken = data.token;
  tokenExpiry = Date.now() + 23 * 60 * 60 * 1000;
  return cachedToken;
}

export async function checkShiprocketServiceability(deliveryPincode, pickupPincode = null, weight = '0.8') {
  const pickup = pickupPincode || process.env.SHIPROCKET_PICKUP_PINCODE || '800002';
  const base = process.env.SHIPROCKET_BASE_URL || 'https://apiv2.shiprocket.in/v1/external';

  let token = null;
  let shiprocketData = null;

  try {
    token = await getShiprocketToken();
    const query = new URLSearchParams({
      pickup_postcode: pickup,
      delivery_postcode: deliveryPincode,
      cod: '1',
      weight: weight.toString(),
    }).toString();

    const res = await fetch(`${base}/courier/serviceability/?${query}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (res.ok) {
      shiprocketData = await res.json();
    }
  } catch (err) {
    console.error('Shiprocket API error:', err.message);
  }

  const couriers = shiprocketData?.data?.available_courier_companies || [];
  const primaryCourier = couriers[0] || null;

  let city = primaryCourier?.city || '';
  let state = primaryCourier?.state || '';
  const etd = primaryCourier?.etd || '';
  const estimatedDays = primaryCourier?.estimated_delivery_days || '';
  const courierName = primaryCourier?.courier_name || '';

  // Reverse postal lookup if city/state wasn't provided in courier response
  if (!city || !state) {
    try {
      const postRes = await fetch(`https://api.postalpincode.in/pincode/${deliveryPincode}`);
      if (postRes.ok) {
        const postData = await postRes.json();
        const postOffice = postData?.[0]?.PostOffice?.[0];
        if (postOffice) {
          if (!city) city = postOffice.District || postOffice.Block || postOffice.Division || '';
          if (!state) state = postOffice.State || '';
        }
      }
    } catch (postErr) {
      console.error('Postal pincode lookup error:', postErr.message);
    }
  }

  // Format state & city properly
  if (state) {
    state = state
      .toLowerCase()
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
  if (city) {
    city = city
      .toLowerCase()
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  const isDeliverable = couriers.length > 0;

  return {
    deliverable: isDeliverable,
    pincode: deliveryPincode,
    city: city || '',
    state: state || '',
    etd: isDeliverable ? (etd || (estimatedDays ? `In ${estimatedDays} days` : '')) : '',
    estimatedDays: isDeliverable ? (estimatedDays || '') : '',
    courierName: courierName || '',
    codAvailable: couriers.some((c) => c.cod === 1 || c.cod === true),
    courierCount: couriers.length,
    message: isDeliverable
      ? `Delivery available via ${courierName || 'Shiprocket'}`
      : 'Delivery not available to this PIN code',
  };
}
