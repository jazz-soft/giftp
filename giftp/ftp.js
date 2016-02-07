var Ftp = require('ftp');
var fs = require('fs');

function connect(arg, func) {
  if (arg.sftp) throw "sftp is not yet implemented";
  var addr = arg.ftp.split(':');
  var host = addr[0];
  var port = addr[1];
  var conn = {host:host};
  if (arg.login) conn.user = arg.login;
  if (arg.password) conn.password = arg.password;
  var ftp = new Ftp();
  ftp.on('ready', function(){func(ftp);});
  ftp.connect(conn);
}

function getIfPossible(ftp, remote, local, func) {
  ftp.get(remote, function(err, stream){
    if (err) {
      //console.log(err);
      func(ftp);
      return;
    }
    stream.once('close', function(){func(ftp);});
    stream.pipe(fs.createWriteStream(local));
  });
}

function send(ftp, remote, local, arr, func) {
  var count = arr.length;
  if (!count) {
    func(ftp);
    return;
  }
  function callback(err) {
    if (err) {
      console.log(err);
      throw err;
    }
    process.stdout.write('.');
    count--;
    if (!count) func(ftp);
  }
  for (var i in arr) ftp.put(local+'/'+arr[i], remote+'/'+arr[i], callback);
}

function remove(ftp, remote, arr, func) {
  var count = arr.length;
  if (!count) {
    func(ftp);
    return;
  }
  function callback(err) {
    if (err) {
      console.log(err);
    }
    process.stdout.write('.');
    count--;
    if (!count) func(ftp);
  }
  for (var i in arr) ftp.delete(remote+'/'+arr[i], callback);
}

function mkdir(ftp, remote, arr, func) {
  var count = arr.length;
  if (!count) {
    func(ftp);
    return;
  }
  function callback(err) {
    if (err) {
      console.log(err);
    }
    process.stdout.write('.');
    count--;
    if (!count) func(ftp);
  }
  for (var i in arr) ftp.mkdir(remote+'/'+arr[i], true, callback);
}

function rmdir(ftp, remote, arr, func) {
  var count = arr.length;
  if (!count) {
    func(ftp);
    return;
  }
  function callback(err) {
    process.stdout.write('.');
    count--;
    if (!count) func(ftp);
  }
  for (var i in arr) rmdirUp(ftp, remote, arr[i], callback);
}

function rmdirUp(ftp, remote, dir, func) {
  var path = dir.split('/');
  if (!path.length || path[path.length-1] != '') path.push('');
  function callback(err) {
    path.length = path.length - 1;
    if (path.length) ftp.rmdir(remote+'/'+path.join('/'), callback);
    else func();
  }
  callback();
}

module.exports = {
  connect: connect,
  send: send,
  remove: remove,
  mkdir: mkdir,
  rmdir: rmdir,
  getIfPossible: getIfPossible
};