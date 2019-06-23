var fs = require('fs');
var cp = require('child_process');

var _root = {};
function root(path) {
  if (!_root[path] && fs.existsSync(path)) {
    var ppp = fs.realpathSync(path).split(/\\|\//);
    for (var n = ppp.length; n; n--) {
      var s = ppp.slice(0, n).concat('.git').join('/');
      if (fs.existsSync(s)) {
        _root[path] = ppp.slice(0, n).join('/');
        break;
      }
    }
  }
  return _root[path];
}

function version() {
  return '' + cp.execSync('git --version');
}

function changes(path, rev) {
  var wt = root(path);
  var n = path.length - wt.length;
  if (rev === undefined) rev = 'HEAD';
  var out = ('' + cp.execSync('git --git-dir=' + wt + '/.git --work-tree=' + wt + ' diff --name-status ' + rev + ' -- ' + path)).split('\n');
  var ret = {};
  for (var i in out) {
    var x = out[i].split('\t');
    if (x[0]) {
      if (ret[x[0]]) ret[x[0]].push(x[1].substr(n));
      else ret[x[0]] = [x[1].substr(n)];
    }
  }
  return ret;
}

function head(path) {
  var wt = root(path);
  return ('' + cp.execSync('git --git-dir=' + wt + '/.git --work-tree=' + wt + ' rev-parse HEAD')).split('\n')[0];
}

module.exports = {
  null: '4b825dc642cb6eb9a060e54bf8d69288fbee4904',
  root: root,
  head: head,
  version: version,
  changes: changes
};