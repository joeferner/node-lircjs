
Install
-------

```
npm install lircjs
```

Example
-------

```
var lircjs = require('lircjs');

var lirc = lircjs.connect();

lirc.on('connect', function() {
  console.log('lirc connected');

  // get a list of remotes
  lirc.remotes(console.log);

  // get a list of remote commands
  lirc.remoteCommands('mceusb', console.log);

  // send IR command
  lirc.sendOnce('mceusb', 'KEY_1', console.error);

  // send multiple IR command
  lirc.sendOnce('mceusb', ['KEY_1', 'KEY_2'], console.error);

  // simulate IR command
  lirc.simulate('0000000000007bfe', 0, 'mceusb', 'KEY_1', console.error);

  setTimeout(function() {
    lirc.close();
  }, 1000);
});

lirc.on('error', function(err) {
  console.log('lirc error', err);
});

lirc.on('end', function(err) {
  console.log('lirc end');
});

lirc.on('code', function(code) {
  console.log('lirc code', code);
});
```
