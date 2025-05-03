const express = require("express");
const cors = require("cors");
const authRoutes = require('./routes/auth');
const creatorRoutes = require('./routes/creators');
const professionRoutes = require('./routes/professionRoutes');
const ownerRoutes = require('./routes/ownerRoutes');
const creatorInfoRoutes = require('./controllers/creatorInfoController');
const itemRoutes = require('./routes/items');
const creatorItemsRoute = require('./routes/creatorItemsRoute');
const itemsRoutes = require('./routes/itemsRoutes');
const updateProfileImage = require('./routes/updateProfileImage');
const creatorLogin = require('./routes/creatorLogin');
const app = express();
require("dotenv").config();



app.use(cors());
app.use(express.json());


app.use('/api/professions', professionRoutes);
app.use('/api/creators', creatorRoutes);
app.use('/api/owner', ownerRoutes);
app.use('/api/creator-info', creatorInfoRoutes);
app.use('/api', itemRoutes);
app.use('/api/creator', creatorItemsRoute);
app.use('/api/items', itemsRoutes);
app.use('/api', updateProfileImage);
app.use('/api/auth', authRoutes);
app.use('/api', creatorLogin);



app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});


app.get("/", (req, res) => {
  res.send("API is working!");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
