# giftp

Synchronize GIT changes via FTP

## giftp stands for GIT and FTP

Are you planning to keep your website in GIT repository
and upload it to the public hosting by FTP?

Then you may consider his little tool.

It can also be used for any other task that requires sending GIT diff via FTP.

## Usage

    node giftp [<config-file>] [<config-name>]

#### <config-file>
- a JSON file with the connection parameters.
If not specified, giftp is looking for a file named giftp.json in the current directory.

#### <config-mame>
- a config name (if there are multiple configs in the file).

    // giftp.json
    {
      "local": "C:/myrepo/html",
      "remote": "/myserver/public_html",
      "ftp": "mydomain.com",
      "login": "mylogin",
      "password": "mypassword"
    }


    // another.json
    {
      "config1": {
        "local": "~/work/myrepo/html",
        "remote": "/myserver/public_html",
        "ftp": "mydomain.com"
      },
      "config2": {
        "local": "~/work/myrepo/img",
        "remote": "/myserver/public_html/img",
        "ftp": "mydomain.com"
      }
    }

