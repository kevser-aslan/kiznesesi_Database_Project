const mysql = require('mysql2');

// MySQL bağlantısını oluştur
const pool = mysql.createPool({
  host: 'localhost', // MySQL sunucu adresi
  user: 'root', // MySQL kullanıcı adı
  password: 'pass123', // MySQL şifresi
  database: 'eTicaret', // Veritabanı adı
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Havuz bağlantısını promisify et
const promisePool = pool.promise();

module.exports = promisePool;
