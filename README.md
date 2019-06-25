# giftp

[![npm](https://img.shields.io/npm/v/giftp.svg)](https://www.npmjs.com/package/giftp)
[![npm](https://img.shields.io/npm/dt/giftp.svg)](https://www.npmjs.com/package/giftp)

Synchronize GIT changes via FTP

## *giftp* stands for GIT and FTP

Are you planning to keep your website in GIT repository
and upload it to the public hosting by FTP?  
Then you may consider this little tool...

It can also be used for any other task that requires sending GIT *diff* via FTP.

### Install

`npm install -g giftp`

### Usage

`giftp [<config-file>] [<config-name>] [--no-delete]`

`<config-file>` - a JSON file with the connection parameters.
If not specified, *giftp* looks for a file named `giftp.json` in the current directory.

`<config-name>` - a config name (if there are multiple configs in the file).

```javascript
// giftp.json
{
  "local": "C:/myrepo/html",
  "remote": "/myserver/public_html",
  "sftp": "mydomain.com",
  "login": "mylogin",
  "password": "mypassword"
}
```

```javascript
// another.json
{
  "config1": {
    "local": "~/work/myrepo/html",
    "remote": "/myserver/public_html",
    "sftp": "mydomain.com"
  },
  "config2": {
    "local": "~/work/myrepo/img",
    "remote": "/myserver/public_html/img",
    "sftp": "mydomain.com:22"
  }
}
```

`local` directory must reside inside the GIT working copy,
but don't have to be its root directory.

`--no-delete` - don't delete remote files.
This option is useful if you remove file from version control, but want to keep it on server.
This flag can be also passed with the config object as `"no_delete": true` .

After synchronizing, *giftp* will place the `.giftp` file with the latest revision ID
in both the `local` and the `remote` directories to use it as the *"from"* revision next time.  
This will allow uploads from several working copies.

To manually tweak the *"from"* revision, you can delete the remote `.giftp` file
and modify the local one.

### Calling from your own code

```javascript
var giftp = require('giftp');
giftp.run({
  local: "/local/path",
  remote: "/remote/path",
  sftp: "myserver.com:22"
});
```
