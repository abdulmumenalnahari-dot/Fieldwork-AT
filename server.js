const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

app.use(cors()); 
app.use(express.json());
app.use('/uploads', express.static('uploads'));

const db = require('./src/config/db');

app.get('/', (req, res) => {
    res.json({ message: '🚀 Welcome to T-Fashion Extended API!' });
});

const profileRoutes = require('./src/routes/profileRoutes');   
const cartRoutes = require('./src/routes/cartRoutes');         
const orderRoutes = require('./src/routes/orderRoutes');       
const walletRoutes = require('./src/routes/walletRoutes');     
const promoRoutes = require('./src/routes/promoRoutes');       
const reviewRoutes = require('./src/routes/reviewRoutes');     
const wishlistRoutes = require('./src/routes/wishlistRoutes'); 

const pdfRoutes = require('./src/routes/pdfRoutes');                   
const paymentRoutes = require('./src/routes/paymentRoutes');           
const notificationRoutes = require('./src/routes/notificationRoutes'); 
const adminRoutes = require('./src/routes/adminRoutes');               
const loyaltyRoutes = require('./src/routes/loyaltyRoutes');           

app.use('/api/profile', profileRoutes);      

app.use('/api/cart', cartRoutes);            

app.use('/api/orders', orderRoutes);         

app.use('/api/wallet', walletRoutes);        

app.use('/api/promotions', promoRoutes);     

app.use('/api/reviews', reviewRoutes);       

app.use('/api/wishlist', wishlistRoutes);    

app.use('/api/invoices', pdfRoutes);          

app.use('/api/payments', paymentRoutes);      

app.use('/api/notifications', notificationRoutes); 

app.use('/api/admin', adminRoutes);           

app.use('/api/loyalty', loyaltyRoutes);       

const PORT = process.env.PORT || 5000;


app.listen(PORT, () => {
    console.log(`🌟 Server is running on http://localhost:${PORT}`);
});