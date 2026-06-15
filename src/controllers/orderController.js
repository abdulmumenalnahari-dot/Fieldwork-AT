const db = require('../config/db');

exports.checkout = async (req, res) => {
    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
        if (!req.body || !req.body.core_user_id) {
            return res.status(400).json({ status: "خطأ", message: "بيانات الطلب غير مكتملة." });
        }

        const { core_user_id, payment_method, shipping_address } = req.body;

        const [cartItems] = await connection.execute(`SELECT * FROM cart_items WHERE core_user_id = ?`, [core_user_id]);
        if (cartItems.length === 0) {
            await connection.rollback();
            return res.status(400).json({ status: "خطأ", message: "السلة فارغة." });
        }

        let total_amount = cartItems.length * 150; 
        const tracking_number = 'TRK-' + Date.now();

        if (payment_method === 'wallet') {
            const [profiles] = await connection.execute(`SELECT wallet_balance FROM user_profiles WHERE core_user_id = ? FOR UPDATE`, [core_user_id]);
            if (profiles.length === 0 || profiles[0].wallet_balance < total_amount) {
                await connection.rollback();
                return res.status(400).json({ status: "خطأ", message: "رصيد المحفظة غير كافٍ." });
            }
            await connection.execute(`UPDATE user_profiles SET wallet_balance = wallet_balance - ? WHERE core_user_id = ?`, [total_amount, core_user_id]);
        }

        const [orderResult] = await connection.execute(
            `INSERT INTO orders (tracking_number, core_user_id, subtotal, total_amount, payment_method, shipping_address) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            [tracking_number, core_user_id, total_amount, total_amount, payment_method, shipping_address]
        );
        const orderId = orderResult.insertId;

        for (let item of cartItems) {
            await connection.execute(
                `INSERT INTO order_items (order_id, core_product_id, quantity, price_at_purchase) VALUES (?, ?, ?, ?)`,
                [orderId, item.core_product_id, item.quantity, 150]
            );
        }
        await connection.execute(`DELETE FROM cart_items WHERE core_user_id = ?`, [core_user_id]);

        await connection.execute(
            `INSERT INTO audit_logs (core_user_id, action, details) VALUES (?, ?, ?)`,
            [core_user_id, 'إتمام الطلب', `تم إنشاء الطلب رقم ${tracking_number} بقيمة ${total_amount}`]
        );

        await connection.commit();
        res.status(200).json({ status: "نجاح", message: "تم إتمام الطلب بنجاح.", tracking_number });

    } catch (error) {
        await connection.rollback();
        console.error(error);
        res.status(500).json({ status: "خطأ", message: "حدث خطأ أثناء معالجة الطلب." });
    } finally {
        connection.release();
    }
};


exports.getOrderDetails = async (req, res) => {
    try {
        const { tracking_number } = req.params;
        
        const [orders] = await db.execute(
            `SELECT * FROM orders WHERE tracking_number = ?`, 
            [tracking_number]
        );

        if (orders.length === 0) {
            return res.status(404).json({ status: "خطأ", message: "الفاتورة غير موجودة." });
        }

        const order = orders[0];
        const [items] = await db.execute(
            `SELECT core_product_id, quantity, price_at_purchase 
             FROM order_items WHERE order_id = ?`, 
            [order.id]
        );

        res.status(200).json({
            status: "نجاح",
            message: "تم جلب تفاصيل الفاتورة بنجاح",
            invoice: {
                tracking_number: order.tracking_number,
                status: order.status,
                payment_method: order.payment_method,
                shipping_address: order.shipping_address,
                financials: {
                    subtotal: order.subtotal,
                    shipping_fee: order.shipping_fee,
                    discount_applied: order.discount_applied,
                    total_amount: order.total_amount
                },
                purchased_items: items,
                created_at: order.created_at
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ status: "خطأ", message: "تعذر جلب تفاصيل الفاتورة." });
    }
};