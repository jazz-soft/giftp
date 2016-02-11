var fs = require('fs');
var git = require('./git.js');
var ftp = require('./ftp.js');

console.log(git.version());

var contents;
var config;
try {
  contents = fs.readFileSync(process.argv[2]);
  config = process.argv[3];
}
catch (e) {
  contents = fs.readFileSync('giftp.json');
  config = process.argv[2];
}
var conf = JSON.parse(contents);
if (config !== undefined) {
  conf = conf[config];
  if (conf === undefined) {
    throw 'Invalid config name: ' + config;
  }
}

if (conf.local === undefined) throw 'Local path undefined';
conf.local = fs.realpathSync(conf.local);
if (conf.remote === undefined) throw 'Remote path undefined';
if (conf.ftp === undefined && conf.sftp === undefined) throw 'Neither ftp nor sftp is defined';
if (!fs.lstatSync(conf.local).isDirectory() || git.root(conf.local) === undefined) throw conf.local + ' is not a valid GIT directory';

var diff = git.changes(conf.local);
if (diff['M'] || diff['A'] || diff['D']) throw 'Please commit the changes!';

var localRev = conf.local+'/.giftp';
var remoteRev = conf.remote+'/.giftp';
var oldRev = git.null;
var newRev = git.head(conf.local);

ftp.connect(conf, getLastSha);

function getLastSha(conn) {
  ftp.getIfPossible(conn, remoteRev, localRev, updateFiles);
}

function updateFiles(conn) {
  try {
    oldRev = ('' + fs.readFileSync(localRev)).trim();
  }
  catch (e) {}
  console.log('old rev:', oldRev);
  console.log('new rev:', newRev);
  console.log('');
  var diff = git.changes(conf.local, oldRev);
  for (var k in diff.A) console.log('A\t' + diff.A[k]);
  for (var k in diff.M) console.log('M\t' + diff.M[k]);
  for (var k in diff.D) console.log('D\t' + diff.D[k]);
  if (!diff.A && !diff.D && !diff.M) {
    console.log('No changes!');
    done(conn);
    return;
  }
  var send = [];
  if (diff.A) send = send.concat(diff.A);
  if (diff.M) send = send.concat(diff.M);
  var remove = [];
  if (diff.D) remove = remove.concat(diff.D);
  var dd = [''];
  for (var i in send) {
    var a = send[i].split('/');
    if (a.length < 2) continue;
    a[a.length - 1] = '';
    dd.push(a.join('/'));
  }
  dd = dd.sort();
  var mkdir = [];
  for (var i=0; i<dd.length; i++) if (dd[i] && (i == dd.length-1 || dd[i+1].substr(0, dd[i].length) != dd[i])) mkdir.push(dd[i]);
  dd = [];
  for (var i in remove) {
    var a = remove[i].split('/');
    if (a.length < 2) continue;
    a[a.length - 1] = '';
    dd.push(a.join('/'));
  }
  dd = dd.sort();
  var rmdir = [];
  for (var i=0; i<dd.length; i++) if (dd[i] && (i == dd.length-1 || dd[i+1].substr(0, dd[i].length) != dd[i])) rmdir.push(dd[i]);

  ftp.remove(conn, conf.remote, remove, function(){
    ftp.rmdir(conn, conf.remote, rmdir, function(){
      ftp.mkdir(conn, conf.remote, mkdir, function(){
        ftp.send(conn, conf.remote, conf.local, send, updateRevision);
      });
    });
  });
}

function updateRevision(conn) {
  fs.writeFileSync(localRev, newRev);
  ftp.send(conn, conf.remote, conf.local, ['.giftp'], done);
}

function done(conn) {
  conn.end();
  console.log('\nDone!');
}
