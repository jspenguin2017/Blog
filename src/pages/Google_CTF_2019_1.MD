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
`,` and `.` keys can be used to rewind or forward frame by frame.

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
`net` package, indicating that it may connect to remote servers. Reading the
PDF document again, I noticed that it mentions something about the security of
connection. I started Wireshark but I didn't manage to find anything
interesting. I then tried to look for a domain-like strings using `strings` and
`grep` as explained in the first quest, and I found
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

Open the file with an image viewer:

```
Logins for socialnetwork & govnetwork:
CTF{congratsyoufoundmycreds}
```

And there is the flag. As a cleanup, the image can be unmounted with:

```
$ sudo umount family
```
