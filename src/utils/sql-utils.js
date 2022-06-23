const fu = require("./file-utils");
const config = require("../../config");
const conn = require("./db-connection");
const moment = require("moment");
require("../../logger");

// Execute db query for batch of records that can be awaited
// batch is an array of fields
async function queryAsync(sql, batch) {
  const result = await conn.query(sql, [batch]);
  return result[0];
}

// Execute db query using passed in sql (i.e., one update), awaited
async function querySqlAsync(sql) {
  const result = await conn.query(sql);
  return result[0];
}

// Truncate table
async function truncateTable(tablename) {
  let sql = `TRUNCATE TABLE ${tablename};`;
  const result = await conn.query(sql);
  return result;
}

// Execute stored procedure
async function storedProcedureAsync(spname, args) {
  if (args === undefined) args = "";
  const sql = `CALL ${spname}(${args});`;
  const result = await conn.query(sql);
  return result[0];
}

/**
 * Try and run a stored procedure and retry if deadlock, up to 3 times
 * @param {string} spName Name of stored procedure to run
 */
async function retryStoredProcedureAsync(spName) {
  if ((typeof spName != "undefined") & (spName != "")) {
    // 4/18/20: If we get an error, retry running the stored procedure
    let errorCount = 0;
    do {
      try {
        log.debug(`Running ${spName}...`);
        const spPesults = await storedProcedureAsync(spName, "");
        log.info(
          `Ran sproc ${spName} results: ${spPesults.affectedRows} rows affected`
        );
        break;
      } catch (error) {
        log.error(`Error running stored procedure ${spName}: ${error}.`);
        if (
          error.message.includes("deadlock") ||
          error.message.includes("timeout")
        ) {
          // Deadlock or timeout error: Retry
          errorCount++;
          log.error(
            `Error running stored procedure ${spName}: ${error}. Retry attempt ${errorCount} of 3`
          );
        } else {
          // Unknown error: Log and quit.
          log.error(
            `Unknown error running stored procedure ${spName}: ${error}.`
          );
          throw error;
        }
      }
    } while (errorCount < 3);
    // Retried but failed: Quit
    if (errorCount === 3) {
      const errMsg = `Retry count exceeded attempting to run stored procedure ${spName}: Attempts: ${errorCount}.`;
      log.error(errMsg);
      throw errMsg;
    }
  }
}

/**
 * Close all connections in the pool
 */
function closePool() {
  pool.end();
}

// Prepared statment execution
async function executeAsync(sql, batch) {
  const result = await conn.execute(sql, batch);
  return result[0];
}

async function lastUpdated(name) {
  // Record last date run for process in database
  const sql = config.app.logLastUpdatedSql;
  return await conn.execute(sql, [name]);
}

/**
 * Converts date to MySQL format. (Note this changes the date to GMT.)
 * @param {string} d Date to be converted
 */
function toMySqlDateGMT(d) {
  try {
    return new Date(d).toISOString().slice(0, 19).replace("T", " ");
  } catch (err) {
    log.error(`Error in sql - utils.toMySqlDateGMT(): ${err} `);
  }
}

/**
 * Converts date to MySQL format without changing date to gmt
 * @param {string} d Date to be converted
 */
function toMySqlDate(d) {
  try {
    const convertedDate = moment(d).format("YYYY-MM-DD HH-mm-ss");
    return convertedDate;
  } catch (err) {
    log.error(`Error in sql - utils.toMySqlDate(): ${err} `);
  }
}

/**
 * Converts date to MySQL format without changing date to gmt
 * @param {string} d Date to be converted
 * @param {string} format Format, like 'YYYY-MM-DD HH-mm-ss'
 */
function toMySqlDateFormat(d, format) {
  try {
    const convertedDate = moment(d).format(format);
    return convertedDate;
  } catch (err) {
    log.error(`Error in sql - utils.toMySqlDate(): ${err} `);
  }
}

// Converts true/false to 1/0
function toMySqlBit(d) {
  try {
    return d === "true" ? 1 : 0;
  } catch (err) {
    log.error(`Error in sql - utils.toMySqlBit(): ${err} `);
  }
}

/**
 * Run query to load data into DB and immediately show warnings. If warnings, save to warnings file
 * @param {string} sql Sql to run as first query
 * @param {array} batch Data to pass to the first query
 * @param {string} filename File name to use to save WARNING file
 * @param {object} log Log object to save logging info
 */
async function handleWarnings(sql, batch, filename) {
  const result = await conn.query(sql, [batch]);
  log.info(`Loaded to db: ${JSON.stringify(result[0])} `);
  const warnings = await conn.query("SHOW WARNINGS");
  if (warnings[0].length > 0) {
    log.warn(`WARNINGS returned from db: ${warnings.length}.See ${filename} `);
    await fu.saveToFile(filename, JSON.stringify(warnings, null, 2), {
      flags: "a",
    });
  }
  return result[0];
}

module.exports = {
  queryAsync,
  querySqlAsync,
  truncateTable,
  storedProcedureAsync,
  retryStoredProcedureAsync,
  executeAsync,
  lastUpdated,
  handleWarnings,
  toMySqlBit,
  toMySqlDate,
  toMySqlDateFormat,
  toMySqlDateGMT,
  closePool,
};
