var fs = require('fs');
var git = require('./git.js');

console.log(git.version());

var contents;
var config;
try {
  contents = fs.readFileSync(process.argv[2]);
  config = process.argv[3];
}
catch (e) {
  contents = fs.readFileSync('settings.json');
  config = process.argv[2];
}
var conf = JSON.parse(contents);
if (config !== undefined) {
  conf = conf[config];
  if (conf === undefined) {
    throw 'Invalid config name: ' + config;
  }
}
var local = conf['local'];
var remote = conf['remote'];
var ftp = conf['ftp'];
var sftp = conf['sftp'];

if (local === undefined) throw 'Local path undefined';
local = fs.realpathSync(local);
if (remote === undefined) throw 'Remote path undefined';
if (ftp === undefined && ftp === undefined) throw 'Neither ftp nor sftp is defined';
if (!fs.lstatSync(local).isDirectory() || git.root(local) === undefined) throw local + ' is not a valid GIT directory';

console.log('head =', git.head(local), '!');

var diff = git.changes(local);
if (diff['M'] || diff['A'] || diff['D']) throw 'Please commit the changes!';


console.log('#2', git.changes(local, git.null));
