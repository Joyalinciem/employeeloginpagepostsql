const mongoose = require('mongoose');

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/taskmanager');
    const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }), 'users');

    const res = await User.findOneAndUpdate({ email: 'admin@test.com' }, { $set: { approved: true, role: 'admin' } }, { new: true });
    console.log('Updated:', res);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
