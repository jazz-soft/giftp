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
    oldRev = '' + fs.readFileSync(localRev);
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
  var mkDir = {};
  var rmDir = {};
  pushSubpaths(diff.A, mkDir);
  pushSubpaths(diff.M, mkDir);
  pushSubpaths(diff.D, rmDir);
  var dd = [''];
  for (var d in mkDir) dd.push(d);
  dd = dd.sort();
  var mkdir = [];
  for (var i=0; i<dd.length; i++) if (dd[i] && (i == dd.length-1 || dd[i+1].substr(0, dd[i].length) != dd[i])) mkdir.push(dd[i]);
  var send = [];
  if (diff.A) send = send.concat(diff.A);
  if (diff.M) send = send.concat(diff.M);
  var remove = [];
  if (diff.D) remove = remove.concat(diff.D);
  ftp.remove(conn, conf.remote, remove, function(){
    ftp.mkdir(conn, conf.remote, mkdir, function(){
      ftp.send(conn, conf.remote, conf.local, send, updateRevision);
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


function dir(path) {
  var a = path.split('/');
  if (a.length) a[a.length-1] = '';
  return a.join('/');
}

function pushSubpaths(a, h) {
  for (var i in a) {
    var p = a[i].split('/');
    if (p.length < 2) continue;
    for (var n = p.length - 1; n > 0; n--) {
      p.length = n; p.push('');
      h[p.join('/')] = true;
    }
  }
}