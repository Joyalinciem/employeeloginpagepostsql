// sockets/chatSocket.js
const jwt = require('jsonwebtoken');
const { canChat } = require('../utils/chatPermissions');

/**
 * Initialize chat socket handling.
// sockets/chatSocket.js
const jwt = require('jsonwebtoken');
const { canChat } = require('../utils/chatPermissions');

/**
 * Initialize chat socket handling.
 * @param {WebSocket.Server} wss - The WebSocket server instance.
 */
function initChatSocket(wss) {
  // Ensure expected maps/functions are attached to wss (added in server.js)
  const { activeSockets, chatGroups, privateChatHistory, groupChatHistory, departmentChatHistory, sendMessageToUser, broadcastGroup } = wss;

  wss.on('connection', async (socket, request) => {
    let decoded;
    try {
      // Expect token in query string: ?token=...
      const url = new URL(request.url, `http://${request.headers.host}`);
      const token = url.searchParams.get('token');
      if (!token) {
        socket.send(JSON.stringify({ error: 'Authentication token missing' }));
        socket.close();
        return;
      }
      // Verify JWT (use same secret as auth middleware)
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
      const userId = decoded.id;
      // Store socket for direct messages
      activeSockets.set(userId, { socket, id: socket._socket.remotePort, role: decoded.role });
      // Notify client of successful auth
      socket.send(JSON.stringify({ type: 'auth_success', userId }));
    } catch (err) {
      socket.send(JSON.stringify({ error: 'Invalid token', details: err?.message }));
      socket.close();
      return;
    }

    // Helper to get user role for permission checks
    async function getUserRole(id) {
      // Lazy import to avoid circular dependencies
      const User = require('../models/User');
      const user = await User.findById(id);
      return user?.role || 'user';
    }

    socket.on('message', async (data) => {
      try {
        const payload = JSON.parse(data);
        
        // Private message handling
        if (payload.type === 'private_message' || payload.type === 'private') {
          const { to, message } = payload;
          const fromId = decoded.id;
          const fromRole = decoded.role;
          const toRole = await getUserRole(to);
          if (!canChat(fromRole, toRole)) {
            socket.send(JSON.stringify({ error: 'RBAC violation: cannot chat with this role' }));
            return;
          }
          const msgPayload = { type: 'private_message', from: fromId, to, message };
          // Save history (logic already in server.js utility)
          if (typeof privateChatHistory?.set === 'function') {
            const key = `${fromId}:${to}`;
            const hist = privateChatHistory.get(key) || [];
            hist.push(msgPayload);
            privateChatHistory.set(key, hist.slice(-200));
          }
          sendMessageToUser(to, msgPayload);
        }
        
        // Group message handling
        else if (payload.type === 'group_message' || payload.type === 'group') {
          const { groupId, message } = payload;
          const fromId = decoded.id;
          const msgPayload = { type: 'group_message', from: fromId, groupId, message };
          // Save group history
          const hist = groupChatHistory.get(groupId) || [];
          hist.push(msgPayload);
          groupChatHistory.set(groupId, hist.slice(-200));
          broadcastGroup(groupId, msgPayload);
        }
        
        // Department message handling
        else if (payload.type === 'department_message' || payload.type === 'department') {
          const { department, message } = payload;
          const fromId = decoded.id;
          const msgPayload = { type: 'department_message', from: fromId, department, message };
          const hist = departmentChatHistory.get(department) || [];
          hist.push(msgPayload);
          departmentChatHistory.set(department, hist.slice(-200));
          broadcastGroup(`dept_${department}`, msgPayload);
        }
        
        // Join group
        else if (payload.type === 'join_group') {
          const { groupId } = payload;
          let members = chatGroups.get(groupId);
          if (!members) {
            members = new Set();
            chatGroups.set(groupId, members);
          }
          members.add(decoded.id);
          socket.send(JSON.stringify({ type: 'joined_group', groupId }));
        }
        
        // Leave group
        else if (payload.type === 'leave_group') {
          const { groupId } = payload;
          const members = chatGroups.get(groupId);
          if (members) {
            members.delete(decoded.id);
          }
          socket.send(JSON.stringify({ type: 'left_group', groupId }));
        }
      } catch (err) {
        console.error('WebSocket message parsing error:', err);
      }
    });

    // Cleanup on close
    socket.on('close', () => {
      if (decoded && decoded.id) {
        activeSockets.delete(decoded.id);
      }
    });
  });
}

module.exports = initChatSocket;
