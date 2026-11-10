// Compatibility layer: Maps legacy logistics calls to Delhivery Production Engine
import {
  checkDelhiveryServiceability,
  fetchDelhiveryWaybill,
  createDelhiveryShipment,
  assignDelhiveryAWB,
  requestDelhiveryPickup,
  getDelhiveryLabelUrl,
  trackDelhiveryOrder,
  cancelDelhiveryOrder,
} from './delhivery.js';

export async function getShiprocketToken() {
  return 'delhivery_active_token';
}

export async function checkShiprocketServiceability(deliveryPincode, pickupPincode = null, weight = '0.45') {
  return await checkDelhiveryServiceability(deliveryPincode, pickupPincode, weight);
}

export async function createShiprocketOrder(order) {
  const shipment = await createDelhiveryShipment(order);
  return {
    order_id: order.orderId,
    shipment_id: shipment.waybill,
    awb_code: shipment.waybill,
    status: 'NEW',
    isSimulated: false,
  };
}

export async function assignShiprocketAWB(shipmentId, courierId = null) {
  const result = await assignDelhiveryAWB(shipmentId);
  return {
    success: true,
    awbCode: result.awbCode,
    courierName: result.courierName,
    courierCompanyId: result.courierCompanyId,
    routingCode: result.routingCode,
    isSimulated: false,
  };
}

export async function requestShiprocketPickup(shipmentId, pickupDate = null) {
  const result = await requestDelhiveryPickup(shipmentId, pickupDate);
  return {
    success: true,
    pickupStatus: result.pickupStatus,
    pickupToken: result.pickupToken,
    pickupScheduledDate: result.pickupScheduledDate,
    isSimulated: false,
  };
}

export async function generateShiprocketLabel(shipmentId) {
  const labelUrl = getDelhiveryLabelUrl(shipmentId);
  return {
    success: true,
    labelUrl,
    isSimulated: false,
  };
}

export async function trackShiprocketOrder({ orderId, shipmentId, awbCode }) {
  const waybill = awbCode || shipmentId;
  return await trackDelhiveryOrder({ waybill, orderId });
}

export async function cancelShiprocketOrder(shiprocketOrderId) {
  return await cancelDelhiveryOrder(shiprocketOrderId);
}
