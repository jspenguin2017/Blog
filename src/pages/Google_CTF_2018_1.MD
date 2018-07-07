# First Look at Google CTF 2018

[The third annual Google CTF](https://security.googleblog.com/2018/05/google-ctf-2018-is-here.html)
took place on June 23, 2018. The quests are now available for everyone to try,
so let's go!

## Letter

This is the first beginner's quest and is extremely easy. The attached ZIP file
contains a PDF file, opening it with Chromium browser shows a letter with
username and password blacked out. However, the text can be selected. Selecting
and pasting everything into an empty document reveals the password:
`CTF{ICanReadDis}`. And that's the flag.

## Floppy

Like before, the attachment is a ZIP file, opening it with 7-Zip, it only
contains one file: `foo.ico`. However, double-clicking on `foo.ico` would
open it like a folder, which reveals 2 more files: `driver.txt` and `www.com`.
Opening `driver.txt`, it shows:

```
This is the driver for the Aluminum-Key Hardware password storage device.
     CTF{qeY80sU6Ktko8BJW}

In case of emergency, run www.com
```

And there's the flag. What's in `www.com`? Well, that needs to wait for later.

## OCR is Cool

This time, the ZIP attachment contains a PNG file, it's the screenshot of an
email, but the text is all gibberish. The quest prompt says:

```
Caesar once said, don't stab me... [...]
```

Caesar?

```
$ caesar
The program 'caesar' is currently not installed. You can install it by typing:
apt install bsdgames
$ sudo apt install bsdgames
[...]
$ man caesar
[...]
NAME
     caesar, rot13 — decrypt caesar ciphers

SYNOPSIS
     caesar [rotation]
[...]
```

Ah, caesar ciphers. It's a simple (and unsafe) encryption algorithm that
rotates the alphabet. Since the flag should look like `CTF{...}`, it doesn't
take long to spot a fishy string in the screenshot. The resolution of the image
is not great, so let's OCR it manually:

```
VMY{vtxltkvbiaxkbltlnulmbmnmbhgvbiaxk}
```

The difference between `C` and `V` is 19:

```
$ caesar 19
VMY{vtxltkvbiaxkbltlnulmbmnmbhgvbiaxk}
OFR{omqemdoubtqduemegnefufgfuazoubtqd}
```

Hum, doesn't look right. 19 rotations forward is for encryption, but for
decryption, the rotations need to be backward. Since there are 26 letters in
the alphabet, rotating forward `26 - 19 = 7` times should be equivalent as
rotating backwards 19 times:

```
$ caesar 7
VMY{vtxltkvbiaxkbltlnulmbmnmbhgvbiaxk}
CTF{caesarcipherisasubstitutioncipher}
```

And indeed, the flag is recovered.

## Security by Obscurity

Like the Floppy quest, 7-Zip isn't fooled by the random file extensions. After
opening a zillion layers of archive folders, a `password.txt` file is revealed.
However, it's password protected.

The password should be pretty weak. To crack it, the innermost archive needs
to be first extracted. This can be done easily by navigating to the upper
directory and dragging `password.x` out. And after a quick Google search,
`fcrackzip` should be the utility to use:

```
$ fcrackzip
The program 'fcrackzip' is currently not installed. You can install it by typing:
apt install fcrackzip
$ sudo apt install fcrackzip
[...]
$ man fcrackzip
[...]
NAME
       fcrackzip - a Free/Fast Zip Password Cracker

SYNOPSIS
       fcrackzip  [-bDBchVvplum2]  [--brute-force]  [--dictionary]  [--benchmark]  [--charset  characterset] [--help]
       [--validate] [--verbose]  [--init-password  string/path]  [--length  min-max]  [--use-unzip]  [--method  name]
       [--modulo r/m] file...
[...]
```

Let's try it:

```
$ fcrackzip --brute-force --charset aA1 --length 1-5 --use-unzip password.x
PASSWORD FOUND!!!!: pw == asdf
```

It only took a few seconds to find the password, and the flag is right there
in `password.txt`: `CTF{CompressionIsNotEncryption}`.

## Floppy 2

Opening `www.com` file, two lines of ASCII text are shown, but nothing looks
like a flag. COM files are executable files for MS-DOS, so I installed DOSBox
and ran the file, it printed out one line:

```
The Foobanizer9000 is no longer on the OffHub DMZ.
```

Hum, still no flag... So what's in the memory? A memory dump can be easily
created with Task Manager. After opening the dump file with Notepad++, it's not
hard to find the flag with the search function: `CTF{g00do1dDOS-FTW}`.

Note that I completed this quest on a Windows 10 device as I thought that would
be easier, but it didn't really matter in the end.

## That's It for Now

That's all for now. I will certainly look into other quests later. In the
meantime, why don't you go try out some quests for yourself?
