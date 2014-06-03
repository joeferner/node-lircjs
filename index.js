'use strict';

var net = require('net');
var events = require('events');
var execFile = require('child_process').execFile;

var irsend = 'irsend';

module.exports.create = function(options) {
  options = options || {};
  options.fileName = options.fileName || '/var/run/lirc/lircd';

  var result = new events.EventEmitter();
  var socket = new net.Socket();
  var connectCallback = null;

  socket.on('connect', function() {
    if (connectCallback) {
      connectCallback();
      connectCallback = null;
    } else {
      return result.emit('connect');
    }
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
    return result.emit('code', evt);
  });

  socket.on('end', function() {
    return result.emit('end');
  });

  socket.on('error', function(err) {
    if (connectCallback) {
      connectCallback(err);
      connectCallback = null;
    } else {
      return result.emit('error', err);
    }
  });

  result.close = function() {
    return socket.end();
  };

  result.connect = function(callback) {
    connectCallback = callback;
    return socket.connect(options.fileName);
  };

  result.remotes = function(callback) {
    callback = callback || console.error;
    return execFile(irsend, ['LIST', '', ''], function(err, stdout, stderr) {
      if (err) {
        return callback(err);
      }
      return callback(null, stderr.trim().split('\n').map(function(l) { return parseIrSendListRemotesLine(l); }));
    });
  };

  result.remoteCommands = function(remote, callback) {
    callback = callback || console.error;
    return execFile(irsend, ['LIST', remote, ''], function(err, stdout, stderr) {
      if (err) {
        return callback(err);
      }
      return callback(null, stderr.trim().split('\n').map(function(l) { return parseIrSendListRemoteCommandsLine(l); }));
    });
  };

  result.sendOnce = function(remote, code, callback) {
    callback = callback || console.error;
    var args = appendCodesToArray([ 'SEND_ONCE', remote ], code);
    return execFile(irsend, args, callback);
  };

  result.sendStart = function(remote, code, callback) {
    callback = callback || console.error;
    var args = appendCodesToArray([ 'SEND_START', remote ], code);
    return execFile(irsend, args, callback);
  };

  result.sendStop = function(remote, code, callback) {
    callback = callback || console.error;
    var args = appendCodesToArray([ 'SEND_STOP', remote ], code);
    return execFile(irsend, args, callback);
  };

  result.simulate = function(code, repeatCount, remoteName, buttonName, callback) {
    callback = callback || console.error;
    return execFile(irsend, ['SIMULATE', code + ' ' + repeatCount + ' ' + remoteName + ' ' + buttonName], callback);
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