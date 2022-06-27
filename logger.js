const log4js = require("log4js");
const config = require("./config");
const level = config.app.nodeLoggingLevel || "info";

const logger = (filename) => {
  return log4js.configure({
    appenders: {
      // Type of dateFile causes a log file to be backed up each day
      app: { type: "dateFile", filename: filename, numBackups: 7 },
      out: { type: "stdout" },
    },
    categories: { default: { appenders: ["out", "app"], level: level } },
  });
};

global.__basedir = __dirname;
const logFile = `/logs/app.log`;
const logPath = `${__basedir}/${logFile}`;
const log = logger(logPath).getLogger("app");
global.log = log;
global.logPath = logPath;
