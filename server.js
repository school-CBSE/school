require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');

const app = express();
app.use(cors());
app.use(express.json());

// ✅ MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB Connected Successfully!'))
  .catch(err => console.log('❌ MongoDB Error:', err));

// ✅ Cloudinary Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ✅ Cloudinary Storage for Images
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'school-website',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
  },
});
const upload = multer({ storage });

// ✅ MongoDB Schema
const ContentSchema = new mongoose.Schema({
  key: { type: String, unique: true },  // e.g. "heroImage", "schoolName"
  value: String,                         // text or image URL
  updatedAt: { type: Date, default: Date.now }
});
const Content = mongoose.model('Content', ContentSchema);

// =====================
// ✅ ROUTES
// =====================

// GET all content
app.get('/api/content', async (req, res) => {
  try {
    const allContent = await Content.find();
    const result = {};
    allContent.forEach(item => {
      result[item.key] = item.value;
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load content' });
  }
});

// SAVE text content
app.post('/api/content', async (req, res) => {
  try {
    const { key, value } = req.body;
    await Content.findOneAndUpdate(
      { key },
      { value, updatedAt: new Date() },
      { upsert: true, new: true }
    );
    res.json({ success: true, message: `${key} saved!` });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save content' });
  }
});

// SAVE multiple content at once
app.post('/api/content/bulk', async (req, res) => {
  try {
    const { data } = req.body; // { key: value, key: value }
    const ops = Object.entries(data).map(([key, value]) => ({
      updateOne: {
        filter: { key },
        update: { value, updatedAt: new Date() },
        upsert: true
      }
    }));
    await Content.bulkWrite(ops);
    res.json({ success: true, message: 'All content saved!' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save content' });
  }
});

// UPLOAD image to Cloudinary
app.post('/api/upload', upload.single('image'), async (req, res) => {
  try {
    const imageUrl = req.file.path;
    const { key } = req.body; // e.g. "heroImage"

    // Save image URL to MongoDB
    await Content.findOneAndUpdate(
      { key },
      { value: imageUrl, updatedAt: new Date() },
      { upsert: true, new: true }
    );

    res.json({ success: true, imageUrl });
  } catch (err) {
    res.status(500).json({ error: 'Image upload failed' });
  }
});

// =====================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
