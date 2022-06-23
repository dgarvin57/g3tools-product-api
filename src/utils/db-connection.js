const mysql = require("mysql2/promise");
const config = require("../../config");
const db = config.db;

// Connect to mysql
// exports.createPool = async function () {
//   return await mysql.createPool({
//     host: db.host,
//     user: db.username,
//     password: db.password,
//     database: db.database,
//     debug: false
//   });
// }

// Connect to mysql
// const connection = mysql.createPool({
//   host: db.host,
//   user: db.username,
//   password: db.password,
//   database: db.database,
//   debug: false
// });

// const connection = mysql.createConnection({
//   host: db.host,
//   user: db.username,
//   password: db.password,
//   database: db.database,
//   debug: false
// });

module.exports = {
  query: async function (sql, data) {
    const connection = await mysql.createConnection({
      host: db.host,
      user: db.user,
      password: db.password,
      database: db.database,
      debug: false,
      typeCast: function castField(field, useDefaultTypeCasting) {
        // We only want to cast bit fields that have a single-bit in them. If the field
        // has more than one bit, then we cannot assume it is supposed to be a Boolean.
        if (field.type === "BIT" && field.length === 1) {
          var bytes = field.buffer();

          // A Buffer in Node represents a collection of 8-bit unsigned integers.
          // Therefore, our single "bit field" comes back as the bits '0000 0001',
          // which is equivalent to the number 1.
          return bytes[0] === 1;
        }
        return useDefaultTypeCasting();
      },
    });

    let results = await connection.query(sql, data);
    connection.close();
    return results;
    //return connection.query(sql, data);
  },
  execute: async function (sql, data) {
    const connection = await mysql.createConnection({
      host: db.host,
      user: db.user,
      password: db.password,
      database: db.database,
      debug: false,
    });
    let results = await connection.execute(sql, data);
    connection.close();
    return results;
  },
};
