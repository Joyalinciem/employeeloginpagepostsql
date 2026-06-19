(async () => {
  try {
    const mongoose = require('mongoose');
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/taskmanager');
    const User = require('../backend/models/User');

    const updated = await User.findOneAndUpdate({ email: 'testuser@example.com' }, { approved: true }, { new: true });
    console.log('Updated user:', updated ? { id: updated._id.toString(), email: updated.email, approved: updated.approved } : 'not found');
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
