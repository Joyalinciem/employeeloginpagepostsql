require('dotenv').config();
const mongoose = require('mongoose');

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const User = mongoose.model(
      'User',
      new mongoose.Schema({ email: String, role: String }),
      'users'
    );

    const res = await User.updateOne(
      { email: 'admin@example.com' },
      { $set: { role: 'admin' } }
    );

    console.log('Update result:', res);

    await mongoose.disconnect();

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
