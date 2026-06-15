const db = require('../config/db');

exports.getDashboardStats = async (req, res) => {
    try {
        const [revenue] = await db.execute(`SELECT SUM(total_amount) as total_revenue, COUNT(id) as total_orders FROM orders WHERE status != 'cancelled'`);
        
   
        const [topProducts] = await db.execute(`
            SELECT core_product_id, SUM(quantity) as sold_quantity 
            FROM order_items 
            GROUP BY core_product_id 
            ORDER BY sold_quantity DESC LIMIT 5
        `);

        const [topUsers] = await db.execute(`
            SELECT core_user_id, SUM(total_amount) as total_spent 
            FROM orders 
            WHERE status != 'cancelled'
            GROUP BY core_user_id 
            ORDER BY total_spent DESC LIMIT 5
        `);

        res.status(200).json({
            status: "نجاح",
            data: {
                revenue_metrics: revenue[0],
                top_selling_products: topProducts,
                vip_customers: topUsers
            }
        });
    } catch (error) {
        res.status(500).json({ status: "خطأ", message: "تعذر جلب إحصائيات الإدارة." });
    }
};