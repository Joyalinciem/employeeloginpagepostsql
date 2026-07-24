// utils/chatPermissions.js
const roleMatrix = {
  user: { user: true },
  manager: { user: true, manager: true },
  cto: { user: true, manager: true, cto: true },
  cfo: { user: true, manager: true, cfo: true },
  admin: { user: true, manager: true, cto: true, cfo: true, admin: true },
};
/**
 * Returns true if a user with `fromRole` is permitted to chat with a user of `toRole`.
 */
function canChat(fromRole, toRole) {
  const allowed = roleMatrix[fromRole] || {};
  return !!allowed[toRole];
}
module.exports = { canChat };
