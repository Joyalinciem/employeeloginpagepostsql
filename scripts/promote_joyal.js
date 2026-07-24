require('dotenv').config();
const mongoose = require('mongoose');

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const User = mongoose.model(
      'User',
      new mongoose.Schema({ email: String, role: String, approved: Boolean }),
      'users'
    );

    const res = await User.updateOne(
      { email: 'joyalanto54@gmail.com' },
      { $set: { role: 'admin', approved: true } }
    );

    console.log('Update result:', res);

    await mongoose.disconnect();

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
