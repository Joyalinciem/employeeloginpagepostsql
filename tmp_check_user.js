const mongoose = require('mongoose');
const User = require('./backend/models/User');
(async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/taskmanager');
    const user = await User.findById('6a0d85f2cb3b775b53da26eb').lean();
    console.log('USER', user);
  } catch (err) {
    console.error('ERROR', err);
  } finally {
    await mongoose.disconnect();
  }
})();
