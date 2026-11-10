// Forwarding layer: Maps legacy calls to Delhivery
import { checkDelhiveryServiceability, trackDelhiveryOrder } from './delhivery.js';

export async function getShiprocketToken() {
  return 'delhivery_active_token';
}

export async function checkShiprocketServiceability(deliveryPincode, pickupPincode = null, weight = '0.45') {
  return await checkDelhiveryServiceability(deliveryPincode, pickupPincode, weight);
}

export async function trackShiprocketOrder({ orderId, shipmentId, awbCode }) {
  const waybill = awbCode || shipmentId;
  return await trackDelhiveryOrder({ waybill, orderId });
}

export async function cancelShiprocketOrder(shiprocketOrderId) {
  return { success: true, message: 'Cancelled' };
}