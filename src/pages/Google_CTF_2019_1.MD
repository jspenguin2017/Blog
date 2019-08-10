# First Look at Google CTF 2019

A new year, a
[new Google CTF](https://security.googleblog.com/2019/05/google-ctf-2019-is-here.html).
And with it, comes new beginners quests. Let's get started!

## Enter Space-Time Coordinates

The attachment contains two files: a text log file, and a binary. The log file
doesn't contains the flag but what about the binary? Knowing the flag should
start with `CTF`, it's pretty easy to extract the flag from the binary using
the `strings` command from `binutils` package:

```
$ strings rand2 | grep CTF
Arrived at the flag. Congrats, your flag is: CTF{welcome_to_googlectf}
```

## Ad

This quest links to a
[YouTube video](https://www.youtube.com/watch?v=QzFuwljOj8Y) which supposedly
contains a flag. The video is a promotional video for Google CTF 2019 event,
and at around `0:17`, a flag is shown on the screen for one frame. Note that
`,` and `.` keys can be used to rewind or forward one frame.

The flag is `CTF{9e796ca74932912c216a1cd00c25c84fae00e139}`.

## Satellite

