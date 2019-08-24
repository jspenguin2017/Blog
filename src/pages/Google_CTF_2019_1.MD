# First Look at Google CTF 2019

A new year, a
[new Google CTF](https://security.googleblog.com/2019/05/google-ctf-2019-is-here.html).
And with it, comes new beginners quests. Let's get started!

## Enter Space-Time Coordinates

The attachment contains two files: a text log file and a binary. The log file
doesn't contain the flag but what about the binary? Knowing that flags should
start with `CTF`, it's pretty easy to extract the flag from the binary using
the `strings` utility from `binutils` package:

```
$ strings rand2 | grep CTF
Arrived at the flag. Congrats, your flag is: CTF{welcome_to_googlectf}
```

## Ad

This quest links to a
[YouTube video](https://www.youtube.com/watch?v=QzFuwljOj8Y) which supposedly
contains a flag. The video is a promotional video for Google CTF 2019 event,
and at around `0:17`, a flag is shown on the screen for one frame. Note that
`,` and `.` keys can be used to rewind and forward one frame at a time.

The flag is `CTF{9e796ca74932912c216a1cd00c25c84fae00e139}`.

## Satellite

Apparently the previous quest is optional, in fact, it doesn't even show up on
the map... Anyway, let's get back on track.

The attachment for this quest is quite large, almost 6 MiB! It contains a PDF
file and a binary, both are around 3 MiB. Since the binary is so large, it is
probably not written in native code. Examining the strings in the binary
further confirms that theory, specifically, the binary is probably written in
the Go programming language.

I spent quite some time trying to decompile and debug the binary, with limited
success. The only significant discovery I made is that the binary uses the
`net` package, indicating that it may connect to remote servers. Note that the
list of package a Go program uses are listed in the `main.init` procedure.

Reading the PDF document again, I noticed that it mentions something about the
security of connection. I started Wireshark but I didn't manage to find
anything interesting. I then tried to look for a domain-like strings using
`strings` and `grep` as explained in the first quest, and I found
`satellite.ctfcompetition.com:1337`. Connecting with a browser didn't work, but
`netcat` did:

```
$ nc satellite.ctfcompetition.com 1337
Welcome. Enter (a) to display config data, (b) to erase all data or (c) to disconnect
a
Username: brewtoot password: CTF{4efcc72090af28fd33a2118985541f92e793477f}
[...]
Remaining config data written to: https://docs.google.com/document/d/14eYPluD_pi3824GAFanS29tWdTcKxP_XUxx7e303-3E
```

Clearly, the password is the flag. Now opening the Google Doc and running its
content through a base 64 decoder:

```
Username: wireshark-rocks
Password: start-sniffing!
```

I tried to enter both usernames to the binary, but neither worked. There might
be more secrets in this binary yet to be discovered.

## Home Computer

The attachment is 25 MiB! Unpacking the ZIP file gives two files: a text file
with some instructions specific for MacOS, and a `.ntfs` image. The image can
be opened using 7-Zip, after navigating around the file system, a file named
`credentials.txt` in the `Documents` directory caught my attention. It reads:

```
I keep pictures of my credentials in extended attributes.
```

After some research, it looks like `getfattr` utility of `attr` package is the
right tool for the task:

```
$ mkdir family
$ sudo mount family.ntfs family
$ cd family
$ getfattr --recursive .
# file: Users/Family/Documents/credentials.txt
user.FILE0
```

Now extract the extended attribute:

```
$ cd Users/Family/Documents
$ getfattr --name=user.FILE0 --only-values credentials.txt > credentials.png
```

Open the file with a picture viewer:

```
Logins for socialnetwork & govnetwork:
CTF{congratsyoufoundmycreds}
```

And there is the flag. As a cleanup, the image can be unmounted with:

```
$ sudo umount family
```

## Work Computer

Although this quest gave a pretty long description, it's just a story and
offers no clues at all. It does give a domain and a port though, let's connect
to it:

```
$ nc readme.ctfcompetition.com 1337
> help
Alien's shell
Type program names and arguments, and hit enter.
The following are built in:
  cd
  help
  exit
Use the man command for information on other programs.
```

After playing around in the shell, I found out that the flag is located in
`/challenge/README.flag`, and I have read access to it. Unfortunately, the
usual commands that dump file content are not available and the shell does not
support operators. It looks like the shell simply finds and execute the file
that matches the first part of input command in `/bin` and pass the rest as
arguments. It also rejects the command if the first part contains `busybox`.

After playing around with it a bit more, I found a path traversal
vulnerability when the shell tries to find the file to execute. After running
through a few directories, two executables caught my attention: `/bin/lzop` and
`/usr/bin/lzopcat`. Combining these two executables with the path traversal
vulnerability, the flag can be extracted:

```
> lzop README.flag
> ../usr/bin/lzopcat README.flag.lzo
CTF{4ll_D474_5h4ll_B3_Fr33}
```

## Conclusion

I'm really impressed that Google managed to create completely different quests
from last year while keeping the quality high. I'll certainly look into other
quests later. In the meantime, why not go try them out yourself?
