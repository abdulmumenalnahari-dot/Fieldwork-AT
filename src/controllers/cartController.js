const db = require('../config/db');

exports.addToCart = async (req, res) => {
    try {
        const { core_user_id, core_product_id, quantity } = req.body;

        const query = `
            INSERT INTO cart_items (core_user_id, core_product_id, quantity) 
            VALUES (?, ?, ?)
            ON DUPLICATE KEY UPDATE 
            quantity = quantity + VALUES(quantity)
        `;

        await db.execute(query, [core_user_id, core_product_id, quantity]);

        await db.execute(
            `INSERT INTO audit_logs (core_user_id, action, details) VALUES (?, ?, ?)`,
            [core_user_id, 'إضافة للسلة', `تمت إضافة المنتج رقم ${core_product_id} بكمية ${quantity}`]
        );

        res.status(200).json({
            status: "نجاح",
            message: "تمت إضافة المنتج إلى سلة المشتريات بنجاح!",
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ status: "خطأ", message: "تعذر إضافة المنتج إلى السلة." });
    }
};


exports.getCart = async (req, res) => {
    try {
        const { user_id } = req.params;
        const [rows] = await db.execute(`SELECT * FROM cart_items WHERE core_user_id = ?`, [user_id]);

        res.status(200).json({
            status: "نجاح",
            message: "تم جلب محتويات السلة بنجاح",
            items_count: rows.length,
            data: rows
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: "خطأ", message: "تعذر جلب بيانات السلة." });
    }
};