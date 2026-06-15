const db = require('../config/db');

exports.createOrUpdateProfile = async (req, res) => {
    try {
        const { core_user_id, phone, address } = req.body;
        
        let avatar_url = null;
        if (req.file) {
            avatar_url = `/uploads/${req.file.filename}`;
        }

        const query = `
            INSERT INTO user_profiles (core_user_id, avatar_url, phone, address) 
            VALUES (?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE 
            avatar_url = COALESCE(VALUES(avatar_url), avatar_url),
            phone = COALESCE(VALUES(phone), phone),
            address = COALESCE(VALUES(address), address)
        `;

        await db.execute(query, [core_user_id, avatar_url, phone, address]);

        await db.execute(
            `INSERT INTO audit_logs (core_user_id, action, details) VALUES (?, ?, ?)`,
            [core_user_id, 'تحديث الملف الشخصي', 'تم تحديث البيانات الديموغرافية بنجاح']
        );

        res.status(200).json({
            status: "نجاح",
            message: "تم تحديث الملف الشخصي بنجاح!",
            data: { core_user_id: Number(core_user_id), avatar_url, phone, address }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ status: "خطأ", message: "حدث خطأ داخلي في الخادم أثناء تحديث البيانات." });
    }
};