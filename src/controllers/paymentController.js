const db = require('../config/db');

exports.processCardPayment = async (req, res) => {
    const { core_user_id, amount, card_token } = req.body;
    
    setTimeout(async () => {
        const transaction_id = 'ch_' + Math.random().toString(36).substr(2, 9);
        
        await db.execute(
            `INSERT INTO audit_logs (core_user_id, action, details) VALUES (?, ?, ?)`,
            [core_user_id, 'عملية دفع ببطاقة', `تم سحب ${amount} بنجاح. رقم العملية: ${transaction_id}`]
        );

        res.status(200).json({
            status: "نجاح",
            message: "تمت معالجة الدفع بنجاح عبر بوابة الدفع.",
            transaction_id: transaction_id
        });
    }, 1500);
};

exports.refundOrder = async (req, res) => {
    const connection = await db.getConnection();
    await connection.beginTransaction();
    try {
        const { tracking_number } = req.body;
        const [orders] = await connection.execute(`SELECT * FROM orders WHERE tracking_number = ? AND status != 'cancelled'`, [tracking_number]);
        
        if (orders.length === 0) throw new Error("الفاتورة غير صالحة للاسترجاع");
        
        const order = orders[0];
        
        await connection.execute(`UPDATE user_profiles SET wallet_balance = wallet_balance + ? WHERE core_user_id = ?`, [order.total_amount, order.core_user_id]);
        
        await connection.execute(`UPDATE orders SET status = 'cancelled' WHERE id = ?`, [order.id]);
        
        await connection.execute(`INSERT INTO audit_logs (core_user_id, action, details) VALUES (?, ?, ?)`, [order.core_user_id, 'استرداد مالي', `تم إلغاء الطلب ${tracking_number} وإعادة ${order.total_amount} للمحفظة`]);

        await connection.commit();
        res.status(200).json({ status: "نجاح", message: "تم إلغاء الطلب واسترداد المبلغ للمحفظة." });
    } catch (error) {
        await connection.rollback();
        res.status(400).json({ status: "خطأ", message: error.message });
    } finally {
        connection.release();
    }
};