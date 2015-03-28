/*
 * api.number-mapper.com
 * Copyright (c) 2015 Sebastian Schumann
 * This code is released under the MIT License.
 * The license is available in the LICENSE file distributed with the project.
 */

// config
var config = require('../config.js');

// load modules
var restify = require('restify');
var bunyan = require('bunyan');
var log = bunyan.createLogger({
  name: "api",
  serializers: {
    req: bunyan.stdSerializers.req
  }
});
var nexmo = require('easynexmo');
nexmo.initialize(config.nexmo.key, config.nexmo.secret, config.nexmo.api, config.nexmo.debug);

// db
var mongo = require('mongodb');
var mongoose = require('mongoose');
var dbUri = "mongodb://" + config.db.server + ":" + config.db.port + "/" + config.db.database;
mongoose.connect(dbUri);

// data model
var Schema = mongoose.Schema;
var User = new Schema({
    mobileNr: { type: String, required: true },
    pin: { type: String, required: true },
    fixedNr: { type: String, required: true, unique: true },
    confirmed: {type: Boolean, required: false},
    modified: { type: Date, default: Date.now }
});
var UserModel = mongoose.model('User', User);

// Server object
var server = restify.createServer({
  name: 'api.number-mapper.com',
  version: config.module.version,
  log: log,
  spdy: {ssl:false, plain:true}
});

// Options
server.use(restify.acceptParser(server.acceptable));
server.use(restify.queryParser());
server.use(restify.bodyParser());
server.use(restify.gzipResponse());
server.use(restify.fullResponse());
server.pre(restify.pre.userAgentConnection());

server.use(restify.throttle({
  burst: 100,
  rate: 50,
  ip: true,
  overrides: {
    '192.168.1.1': {
      rate: 0, // unlimited
      burst: 0
    }
  }
}));

// API response
var api = {};
api.meta = {};
api.meta.id = "api.number-mapper.com " + config.module.version;
api.meta.version = "v1";
api.meta.release = config.module.release;

/* support functions */
// Check if String starts with certain substring
function startsWith(str, q) {
  return (str.lastIndexOf(q, 0) === 0);
}

// Normalize MSISDNs, expect Slovak format
function normalizeMsisdn(phone) {
  phone = phone.replace(/\s+/g, '');
  if(startsWith(phone, "00")) {
    return phone.slice(2, phone.length);
  } else if(startsWith(phone, "+")) {
    return phone.slice(1, phone.length);
  } else if(startsWith(phone, "0")) {
    return "421" + phone.slice(1, phone.length);
  } else {
    return phone;
  }
}

/* GENERAL */
server.get('/', function (req, res, next) {
  api.response = {};
  api.response.type = "error";
  api.response.description = "The current API is version 1 and reachable at /api/v1";
  res.status(404);
  res.contentType = 'json';
  res.send(api);
  return next();
});

server.get('/api', function (req, res, next) {
  api.response = {};
  api.response.type = "error";
  api.response.description = "The current API is version 1 and reachable at /api/v1";
  res.status(404);
  res.contentType = 'json';
  res.send(api);
  return next();
});

server.get('/api/v1', function(req, res, next) {
  api.response = {};
  api.response.type = "success";
  api.response.description = "Current base URL for api.number-mapper.com";
  //json(200, api);
  res.contentType = 'json';
  res.send(200, api);
  return next();
});

/* ACTUAL API */
// CRUD part
server.get('/api/v1/users', function (req, res, next){
  return UserModel.find(function (err, users) {
    if (!err) {
      res.send(200, users);
    } else {
      console.log(err);
      res.send(503);
    }
    return next();
  });
});

server.post('/api/v1/users', function (req, res, next){
  var user;
  console.log("POST: ");
  console.log(req.body);
  user = new UserModel({
    mobileNr: req.body.mobileNr,
    pin: req.body.pin,
    fixedNr: req.body.fixedNr,
    confirmed: req.body.confirmed
  });
  user.save(function (err) {
    if (!err) {
      console.log("created");
      res.send(201, user);
    } else {
      console.log(err);
      res.send(400);
    }
    return next();
  });
  return next();
});

server.get('/api/v1/users/:id', function (req, res, next){
  UserModel.findById(req.params.id, function (err, user) {
    if (!err) {
      res.send(200, user);
    } else {
      console.log(err);
      res.send(500);
    }
    return next();
  });
  return next();
});

server.put('/api/v1/users/:id', function (req, res, next){
  UserModel.findById(req.params.id, function (err, user) {
    user.mobileNr = req.body.mobileNr;
    user.pin = req.body.pin;
    user.fixedNr = req.body.fixedNr;
    user.confirmed = req.body.confirmed;
    user.save(function (err) {
      if (!err) {
        console.log("updated");
        res.status(200);
      } else {
        console.log(err);
        res.status(503);
      }
      res.send(user);
      return next();
    });
    return next();
  });
  return next();
});

server.del('/api/v1/users/:id', function (req, res, next){
  UserModel.findById(req.params.id, function (err, user) {
    user.remove(function (err) {
      if (!err) {
        console.log("removed");
        res.send(204);
        return next();
      } else {
        console.log(err);
        res.send(503);
      }
    });
    return next();
  });
  return next();
});

// Application
server.get('/api/v1/mobile', function(req, res, next) {
  // Retrieve data
  var sms = {};
  sms.msisdn = req.params.msisdn;
  sms.text = req.params.text;
  var action = sms.text.split(" ");
  if(config.web.debug) {
    console.log("SMS:");
    console.log(sms);
    console.log("Actions:");
    console.log(action);
  }

  // Parse content
  if(action[0].toLowerCase() === "link") {
    var fixedNr = normalizeMsisdn(action[1]);
    var pin = "";
    for (var i = 0; i < 4; i++) {
      pin = pin + Math.floor(Math.random() * 9 + 1);
    }
    var mobileNr = sms.msisdn;

    // Create entry with sender (msisdn), target (fixedNr), pin (pin)
    var user = new UserModel({
      mobileNr: mobileNr,
      pin: pin,
      fixedNr: fixedNr
    });
    console.log("New user data:");
    console.log(user);
    nexmo.sendTextMessage("F2M", mobileNr, "Your PIN is " + pin, "", function cb (err,messageResponse) {
      if (err) {
        console.log(err);
      } else {
        console.log(messageResponse);
        user.save(function (err) {
          if (!err) {
            console.log("User created.");
            res.send(201, user);
         } else {
            console.log("An error occurred.");
            console.log(err);
            res.send(200);
          }
        });

       }
    });
  } else {
    console.log("Verb not understood.");
    res.send(200);
  }
  return next();
});

server.get('/api/v1/fixed', function(req, res, next) {
  // Retrieve data
  if(config.web.debug) {
    console.log("Status report:");
    console.log(req.params);
  }
  var fixedNr = req.params.fixedNr.substring(1);
  var pin = req.params.pin;
  if(config.web.debug) {
    console.log("F: " + fixedNr + ", PIN: " + pin);
  }

  // Find entry
  UserModel.findOne({"fixedNr" : fixedNr,"pin" : pin}, function (err, user) {
    if (!err) {
      console.log(user);
      if(user !== null) {
        if(user.pin === pin) {
          user.confirmed = true;
          user.save(function (err) {
            if (!err) {
              console.log("PIN confirmed.");
              res.send(200, user);
            } else {
              console.log("An error occurred.");
              console.log(err);
              res.send(400);
            }
          });
        } else {
          console.log("PIN wrong, link not confirmed.");
          res.send(403);
        }
      } else {
        console.log("User not found.");
        res.send(404);
      }

    } else {
      console.log("An error occurred.");
      console.log(err);
      res.send(500);
    }
  });
  return next();
});

server.get('/api/v1/request-fixed/:number', function(req, res, next) {
  // Retrieve data
  if(config.web.debug) {
    console.log("Status report:");
    console.log(req.params);
  }
  var fixedNr = normalizeMsisdn(req.params.number);

  // Find entry
  UserModel.findOne({"fixedNr" : fixedNr}, function (err, user) {
    if (!err) {
      if(user !== null) {
        console.log("exists");
        res.send(200, user.mobileNr);
      } else {
        console.log("does not exist");
        res.send(404);
      }
    } else {
      console.log("An error occurred.");
      console.log(err);
      res.send(400);
    }
    return next();
  });
});

server.get('/api/v1/verify-fixed/:number', function(req, res, next) {
  // Retrieve data
  if(config.web.debug) {
    console.log("Status report:");
    console.log(req.params);
  }
  var fixedNr = normalizeMsisdn(req.params.number);

  // Find entry
  UserModel.findOne({"fixedNr" : fixedNr,"confirmed":true}, function (err, user) {
    if (!err) {
      if(user !== null) {
        console.log("confirmed");
        res.send(200, user.mobileNr);
      } else {
        console.log("not confirmed");
        res.send(404);
      }
    } else {
      console.log("An error occurred.");
      console.log(err);
      res.send(400);
    }
    return next();
  });
});

server.get('/api/v1/verify-mobile/:number', function(req, res, next) {
  // Retrieve data
  if(config.web.debug) {
    console.log("Status report:");
    console.log(req.params);
  }
  var mobileNr = normalizeMsisdn(req.params.number);

  // Find entry
  UserModel.findOne({"mobileNr" : mobileNr,"confirmed":true}, function (err, user) {
    if (!err) {
      if(user !== null) {
        console.log("confirmed");
        res.send(200, user.fixedNr);
      } else {
        console.log("not confirmed");
        res.send(404);
      }
    } else {
      console.log("An error occurred.");
      console.log(err);
      res.send(400);
    }
    return next();
  });
});

/* TEST END-POINTS */
server.get('/api/v1/incoming-sms', function(req, res, next) {
  var sms = {};
  sms.msisdn = req.params.msisdn;
  sms.to = req.params.to;
  sms.messageId = req.params.messageId;
  sms.text = req.params.text;
  sms.type = req.params.type;
  sms.messageTimestamp = req.params["message-timestamp"];
  if(config.web.debug) {
    console.log("INCOMING SMS:");
    console.log(sms);
  }
  res.send("ok");
  return next();
});

server.get('/api/v1/restcomm', function(req, res, next) {
  if(config.web.debug) {
    console.log("Status report:");
    console.log(req.params);
  }
  res.send(200, "RestComm data processed");
  return next();
});

server.get('/api/v1/status', function(req, res, next) {
  if(config.web.debug) {
    console.log("Status report:");
    console.log(req.params);
  }
  res.send("Status received");
  return next();
});

server.pre(function (request, response, next) {
  request.log.info({ req: request }, 'REQUEST');
  next();
});

server.listen(config.web.port, function () {
  console.log('%s listening at %s', server.name, server.url);
});
