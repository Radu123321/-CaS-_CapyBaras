// ===== ALERT SERVICE STUB (alerts fully disabled) =====
// This file replaces the previous implementation and exports the same
// method names returning resolved promises so that any existing `require`
// calls do not break, while ensuring no alerts are generated, no SMTP
// initialisation is attempted and no logs are produced.

'use strict';

const noop = async () => ({ disabled: true });

module.exports = {
  // Generic create
  createAlert: noop,
  // Equipment
  sendEquipmentFailureAlert: noop,
  sendMaintenanceDueAlert: noop,
  // Staff / shift
  sendStaffUnavailabilityAlert: noop,
  // Inventory
  sendCriticalInventoryAlert: noop,
  // Transport
  sendTransportDelayAlert: noop,
  // Power / weather
  sendPowerOutageAlert: noop,
  // Misc
  sendTestEmail: noop,
  // History / stats getters return empty values
  getAlertHistory: () => [],
  getDeliveryStats: () => ({}),
  getAvailableAlertTypes: () => [],
  getConfiguration: () => ({}),
  updateConfiguration: () => {},
  clearOldAlerts: () => 0,
}; 