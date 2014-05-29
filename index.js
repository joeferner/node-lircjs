'use strict';

var net = require('net');
var events = require('events');
var execFile = require('child_process').execFile;

var irsend = 'irsend';

module.exports.connect = function(fileName) {
  fileName = fileName || '/var/run/lirc/lircd';

  var result = new events.EventEmitter();
  var socket = new net.Socket();

  socket.on('connect', function() {
    result.emit('connect');
  });

  socket.on('data', function(data) {
    var str = data.toString().trim();
    var parts = str.split(' ');
    var evt = {
      code: parts[0],
      repeatCount: parts[1],
      buttonName: parts[2],
      remoteName: parts[3]
    };
    result.emit('code', evt);
  });

  socket.on('error', function(err) {
    result.emit('error', err);
  });

  process.nextTick(function() {
    socket.connect(fileName);
  });

  result.remotes = function(callback) {
    execFile(irsend, ['LIST', '', ''], function(err, stdout, stderr) {
      if (err) {
        return callback(err);
      }
      return callback(null, stderr.trim().split('\n').map(function(l) { return parseIrSendListRemotesLine(l); }));
    });
  };

  result.remoteCommands = function(remote, callback) {
    execFile(irsend, ['LIST', remote, ''], function(err, stdout, stderr) {
      if (err) {
        return callback(err);
      }
      return callback(null, stderr.trim().split('\n').map(function(l) { return parseIrSendListRemoteCommandsLine(l); }));
    });
  };

  result.sendOnce = function(remote, code, callback) {
    var args = appendCodesToArray([ 'SEND_ONCE', remote ], code);
    callback = callback || function() {};
    execFile(irsend, args, function(err, stdout, stderr) {
      if (err) {
        return callback(err);
      }
      return callback();
    });
  };

  return result;
};

function parseIrSendListRemotesLine(line) {
  return line.substr('irsend:'.length).trim();
}

function parseIrSendListRemoteCommandsLine(line) {
  line = parseIrSendListRemotesLine(line);
  var m = line.match(/(.*)\s(.*)$/);
  return {
    code: m[1],
    buttonName: m[2]
  };
}

function appendCodesToArray(arr, code) {
  if (code instanceof Array) {
    return arr.concat(code);
  } else {
    arr.push(code);
    return arr;
  }
}