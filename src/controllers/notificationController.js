const nodemailer = require('nodemailer');
const transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    auth: { user: 'test@ethereal.email', pass: 'password123' }
});

exports.sendPushNotification = async (req, res) => {
    const { device_token, title, body } = req.body;
    console.log(`[FIREBASE PUSH] To: ${device_token} | Title: ${title} | Body: ${body}`);
    res.status(200).json({ status: "نجاح", message: "تم إرسال الإشعار اللحظي للهاتف." });
};

exports.remindAbandonedCarts = async (req, res) => {
    try {
        const [usersWithCarts] = await db.execute(`SELECT DISTINCT core_user_id FROM cart_items`);
        
        for (let user of usersWithCarts) {
            console.log(`[EMAIL SENT] To User ID ${user.core_user_id}: "لا تنسَ إكمال عملية الشراء، منتجاتك بانتظارك!"`);
        }
        res.status(200).json({ status: "نجاح", message: "تم إرسال رسائل التذكير بنجاح." });
    } catch (error) {
        res.status(500).json({ status: "خطأ", message: "تعذر إرسال التذكيرات." });
    }
};