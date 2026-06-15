const db = require('../config/db');

exports.toggleWishlist = async (req, res) => {
    try {
        const { core_user_id, core_product_id } = req.body;

        const [existing] = await db.execute(
            `SELECT * FROM wishlist WHERE core_user_id = ? AND core_product_id = ?`,
            [core_user_id, core_product_id]
        );

        if (existing.length > 0) {
            await db.execute(`DELETE FROM wishlist WHERE id = ?`, [existing[0].id]);
            return res.status(200).json({ status: "نجاح", message: "تمت إزالة المنتج من المفضلة." });
        } else {
            await db.execute(
                `INSERT INTO wishlist (core_user_id, core_product_id) VALUES (?, ?)`,
                [core_user_id, core_product_id]
            );
            return res.status(200).json({ status: "نجاح", message: "تمت إضافة المنتج إلى المفضلة." });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: "خطأ", message: "حدث خطأ في تحديث المفضلة." });
    }
};