#!/usr/bin/env node

if (require.main === module) run();
else module.exports.run = run;

function run(conf) {
  var pkg = require('./package.json');
  var fs = require('fs');
  var git = require('./git-calls.js');
  var ftp = require('./ftp-calls.js');
  console.log(pkg.name, 'version', pkg.version);
  console.log(git.version());
  var contents;
  var config;
  var n;
  if (conf === undefined) {
    var args = [];
    var flags = {};
    for (n = 2; n < process.argv.length; n++) {
      if (process.argv[n] == '--no-delete') flags.no_delete = true;
      else args.push(process.argv[n]);
    }
    try {
      contents = fs.readFileSync(args[0]);
      config = args[1];
    }
    catch (e) {
      contents = fs.readFileSync('giftp.json');
      config = args[0];
    }
    conf = JSON.parse(contents);
    if (config !== undefined) {
      conf = conf[config];
      if (conf === undefined) {
        throw 'Invalid config name: ' + config;
      }
    }
  }
  for (n in flags) conf[n] = flags[n];

  if (conf.local === undefined) throw 'Local path undefined';
  conf.local = fs.realpathSync(conf.local);
  if (conf.sftp === undefined) throw 'sftp address undefined';
  if (conf.remote === undefined) throw 'Remote path undefined';
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
      oldRev = (''+fs.readFileSync(localRev)).trim();
    }
    catch (e) {}
    console.log('old rev:', oldRev);
    console.log('new rev:', newRev);
    console.log('');
    var diff = git.changes(conf.local, oldRev);
    var a, i, k;
    for (k in diff.A) console.log('A\t' + diff.A[k]);
    for (k in diff.M) console.log('M\t' + diff.M[k]);
    for (k in diff.D) console.log('D\t' + diff.D[k]);
    if (!diff.A && !diff.D && !diff.M) {
      console.log('No changes!');
      done(conn);
      return;
    }
    var send = [];
    if (diff.A) send = send.concat(diff.A);
    if (diff.M) send = send.concat(diff.M);
    var remove = [];
    if (diff.D && !conf.no_delete) remove = remove.concat(diff.D);
    var dd = [''];
    for (i in send) {
      a = send[i].split('/');
      if (a.length < 2) continue;
      a[a.length - 1] = '';
      dd.push(a.join('/'));
    }
    dd = dd.sort();
    var mkdir = [];
    for (i = 0; i < dd.length; i++) if (dd[i] && (i == dd.length-1 || dd[i+1].substr(0, dd[i].length) != dd[i])) mkdir.push(dd[i]);
    dd = [];
    for (i in remove) {
      a = remove[i].split('/');
      if (a.length < 2) continue;
      a[a.length - 1] = '';
      dd.push(a.join('/'));
    }
    dd = dd.sort();
    var rmdir = [];
    for (i = 0; i < dd.length; i++) if (dd[i] && (i == dd.length-1 || dd[i+1].substr(0, dd[i].length) != dd[i])) rmdir.push(dd[i]);

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
    ftp.stop(conn);
    console.log('\nDone!');
  }
}
