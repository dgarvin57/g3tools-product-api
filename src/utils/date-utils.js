const moment = require('moment')
const dateformat = require('dateformat')
const momentTz = require('moment-timezone')

// Given positive or negative number of days, calculate the
// date from now.
exports.dateCalc = function (days) {
  let currentTime = new Date()
  currentTime.setDate(currentTime.getDate() + days)
  return currentTime
}

/**
 * @param {date} date The starting date
 * @param {int} amt The amt to subtract
 * @param {string} timeValue The value to use for amt (months, days, minutes, seconds, etc.)
 */
exports.dateSubtract = function (date, amt, timeValue) {
  return moment(date).subtract(amt, timeValue).toDate()
}

/** Add to a date/time
 * @param {date} date The starting date
 * @param {int} amt The amt to add (can be negative)
 * @param {string} timeValue The value to use for amt (months, days, minutes, seconds, etc.)
 */
exports.dateAdd = function (date, amt, timeValue) {
  return moment(date).add(amt, timeValue).toDate()
}

// Sleeps for given millisecondes
exports.sleep = function (ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Given two dates, returns the number of seconds between them
 */
exports.diffSeconds = function (datea, dateb) {
  const a = moment(datea)
  const b = moment(dateb)

  //if (b < a) throw (`First date ${datea} must be before second date ${dateb}`);
  if (a === b) return 0
  const diff = b.diff(a, 'seconds')
  return diff
}

// Returns current date as 2019-12-17 15:33:24
exports.now = function () {
  return moment().format('YYYY-MM-DD HH:mm:ss')
}

// Returns current date as 2019-12-17
exports.today = function (format = 'YYYY-MM-DD') {
  return moment().format(format)
}

// Returns passed in date as 2019-12-17_15-33-24
exports.fileTimestamp = function (date) {
  if (date === undefined) {
    return moment().format('YYYY-MM-DD_HH-mm-ss')
  } else {
    return moment(date).format('YYYY-MM-DD_HH-mm-ss')
  }
}

// Compare two dates (with or without time) and will return
// true if passed in date in the past (date only)
exports.isDateInPast = function (date) {
  // Comparison excluding time.
  const dateNow = moment() // Now
  return moment(dateNow).isAfter(date, 'day')
}

// Formats the given string with the given format
exports.formatDate = function (date, formatString, convertToUTC) {
  return dateformat(date, formatString, convertToUTC)
}

exports.yearMonth = function (date) {
  return moment(date).format('YYYY-MM')
}

/**
 * Given a date, convert from one timezone to another
 * @param {date} date The date to be converted
 * @param {string} fromTz The timezone to be converted from (like "America/Los_Angeles")
 * @param {string} toTz The timezone to be converted into
 */
exports.convertTimezones = function (date, fromTz, toTz, toISO) {
  try {
    if (date === '') return ''
    //const newTime = new Date(moment.tz(date, fromTz).tz(toTz).format('YYYY-MM-DD HH:mm:ss'))
    let newTime = ''

    if (toISO) {
      newTime = moment
        .tz(date, fromTz)
        .tz(toTz)
        .format('YYYY-MM-DDTHH:mm:ss.999Z')
    } else {
      newTime = moment
        .tz(date, fromTz)
        .tz(toTz)
        .format('YYYY-MM-DD HH:mm:ss.999')
    }
    return newTime
  } catch (err) {
    log.error(`Error in date-utils.js convertTimezones(): ${err}`)
  }
}

/**
 * Given a Pacific date (date from database is always pacific), convert to
 */
exports.convertToPacific = function (date, inputFormat) {
  try {
    if (date === '') return ''
    let isoDate = ''
    if (date.toString().includes('UTC')) {
      // Date is UTC string; convert to iso format
      isoDate = date.replace(' UTC', 'Z').replace(' ', 'T')
    } else isoDate = date
    // if (!moment(date, moment.ISO_8601).isValid()) {
    //   // Not iso format
    //   log.error(`Date ${date} is not ISO format`)
    //   return date;
    // }
    //const useDate = momentTz(date).toISOString();
    return momentTz(isoDate, inputFormat)
      .tz('America/Los_Angeles')
      .format('YYYY-MM-DD HH:mm:ss')
  } catch (err) {
    log.error(`Error in date-utils.js convertToPacific(): ${err}`)
  }
}

/**
 * Given a local date, convert it to GMT time and return it as ISO format
 */
exports.convertToUTC = function (date) {
  return momentTz(date).utc().format()
}
