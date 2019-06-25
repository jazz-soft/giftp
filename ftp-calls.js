var SSH2 = require('ssh2');

function connect(arg, func) {
  var addr = arg.sftp.split(':');
  var host = addr[0];
  var port = addr[1];
  var conn = { host: host, readyTimeout: 5000 };
  if (port) conn.port = port;
  if (arg.login) conn.username = arg.login;
  if (arg.password) conn.password = arg.password;
  var ssh2 = new SSH2();
  ssh2.on('error', function(err) { throw err; });
  ssh2.on('ready', function(){
    console.log('connected to', arg.sftp);
    ssh2.sftp(function(err, sftp) {
      if (err) throw err;
      func([sftp, ssh2]);
    });
  });
  ssh2.connect(conn);
}

function getIfPossible(conn, remote, local, func) {
  conn[0].fastGet(remote, local, {}, function(err) {
    if (err) console.log(err.message);
    if (func) func(conn);
    else conn[1].end();
  });
}

function send(conn, remote, local, arr, func) {
  var count = arr.length;
  if (!count) {
    if (func) func(conn);
    else conn[1].end();
    return;
  }
  function callback(err) {
    if (err) {
      console.log(err);
      throw err;
    }
    process.stdout.write('.');
    count--;
    if (!count) {
      if (func) func(conn);
      else conn[1].end();
    }
  }
  for (var i in arr) {
    conn[0].fastPut(local+'/'+arr[i], remote+'/'+arr[i], {}, callback);
  }
}

function remove(conn, remote, arr, func) {
  var count = arr.length;
  if (!count) {
    if (func) func(conn);
    else conn[1].end();
    return;
  }
  function callback(err) {
    if (err) {
      console.log(err);
    }
    process.stdout.write('.');
    count--;
    if (!count) {
      if (func) func(conn);
      else conn[1].end();
    }
  }
  for (var i in arr) conn[0].unlink(remote+'/'+arr[i], callback);
}

function mkdir(conn, remote, arr, func) {
  var count = arr.length;
  if (!count) {
    if (func) func(conn);
    else conn[1].end();
    return;
  }
  function callback(err) {
    if (err) {
      console.log(err);
    }
    process.stdout.write('.');
    count--;
    if (!count) {
      if (func) func(conn);
      else conn[1].end();
    }
  }
  for (var i in arr) {
    conn[0].mkdir(remote+'/'+arr[i], callback);
  }
}

function rmdir(conn, remote, arr, func) {
  var count = arr.length;
  if (!count) {
    if (func) func(conn);
    else conn[1].end();
    return;
  }
  function callback() {
    process.stdout.write('.');
    count--;
    if (!count) {
      if (func) func(conn);
      else conn[1].end();
    }
  }
  for (var i in arr) {
    rmdirUp(conn, remote, arr[i], callback);
  }
}

function rmdirUp(conn, remote, dir, func) {
  var path = dir.split('/');
  if (!path.length || path[path.length-1] != '') path.push('');
  function callback() {
    path.length = path.length - 1;
    if (path.length) conn[0].rmdir(remote+'/'+path.join('/'), callback);
    else func();
  }
  callback();
}

/*
function connectWithLogin(conn, func) { // this function is broken!
  if (conn.user) {
    connectWithPassword(conn, func);
  }
  else {
    process.stdout.write('FTP login: ');
    var stdin = process.stdin;
    stdin.resume();
    stdin.setEncoding('utf8');
    stdin.once('data', function(str){
      stdin.pause();
      conn.user = (''+str).trim();
      connectWithPassword(conn, func);
    });
  }
}

function connectWithPassword(conn, func) { // this function is broken!
  var prompt = 'Password for ' + conn.user + ': ';
  process.stdout.write(prompt);

  var stdin = process.stdin;
  stdin.setRawMode(true);
  stdin.resume();
  stdin.setEncoding('utf8');

  var password = '';
  stdin.on('data', function(ch){
    ch = ch.toString('utf8');
    if (ch == '\n' || ch == '\r' || ch == '\u0004') {
      process.stdout.write('\n\n');
      stdin.setRawMode(false);
      stdin.pause();
      conn.password = password;
      var ftp = new Ftp();
      ftp.on('ready', function(){func(ftp);});
      ftp.connect(conn);
    }
    else if (ch == '\u0003') { // Ctrl-C
      stdin.pause();
    }
    else if (ch.charCodeAt(0) == 8) { // Backspace
      password = password.slice(0, password.length - 1);
      process.stdout.clearLine();
      process.stdout.cursorTo(0);
      process.stdout.write(prompt);
      process.stdout.write(password.split('').map(function(){ return '*';}).join(''));
    }
    else {
      process.stdout.write('*');
      password += ch;
    }
  });
*/
function stop(conn) { conn[1].end(); }

module.exports = {
  connect: connect,
  send: send,
  remove: remove,
  mkdir: mkdir,
  rmdir: rmdir,
  getIfPossible: getIfPossible,
  stop: stop
};
