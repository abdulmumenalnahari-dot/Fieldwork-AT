const mysql = require('mysql2');
require('dotenv').config();

const pool = mysql.createPool({
    uri: process.env.DATABASE_URL,
    
    ssl: {
        rejectUnauthorized: false
    },
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

const db = pool.promise();

pool.getConnection((err, connection) => {
    if (err) {
        console.error('❌ خطأ في الاتصال بقاعدة البيانات السحابية (Aiven):', err.message);
    } else {
        console.log('✅ تم الاتصال بقاعدة البيانات السحابية (Aiven MySQL) بنجاح وأمان!');
        connection.release();
    }
});

module.exports = db;