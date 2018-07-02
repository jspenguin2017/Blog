# First Look at Google CTF 2018

[The third annual Google CTF](https://security.googleblog.com/2018/05/google-ctf-2018-is-here.html)
took place on June 23, 2018. The quests are now available for everyone to try,
so let's go!

## Letter

This is the first beginner's quest and is extremely easy. The attached ZIP file
contains a PDF file, opening it shows a letter with username and password
blacked out. However, the text can be selected. Selecting and pasting
everything into an empty document reveals the password: `CTF{ICanReadDis}`.
And that is the flag.

## Floppy

Like before, the attachment is a ZIP file, opening it with 7-Zip shows that it
contains just one file: `foo.ico`. However, double-clicking on `foo.ico` would
open it like a folder, which reveals 2 files: `driver.txt` and `www.com`.
Opening `driver.txt`, it shows:

```
This is the driver for the Aluminum-Key Hardware password storage device.
     CTF{qeY80sU6Ktko8BJW}

In case of emergency, run www.com
```

And there is the flag. What's in `www.com`? Well, that needs to wait for
later.

## OCR is Cool

This time, the ZIP attachment contains a PNG file, it is the screenshot of an
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

Ah, caesar ciphers. It is a simple (and unsafe) encryption algorithm that
rotates the alphabet. Since the flag should look like `CTF{...}`, it doesn't
take long to spot a fishy string in the screenshot. The resolution of the image
is not great, so let's OCR it manually:

```
VMY{vtxltkvbiaxkbltlnulmbmnmbhgvbiaxk}
```

The difference between `C` and `V` is 19, let's try it:

```
$ caesar 19
VMY{vtxltkvbiaxkbltlnulmbmnmbhgvbiaxk}
OFR{omqemdoubtqduemegnefufgfuazoubtqd}
```

Hum, doesn't look right. Since we are trying to decrypt the cypher, it needs
to be rotated backward, but since there are 26 letters in the alphabet,
rotating forward `26 - 19 = 7` times should be equivalent as rotating backwards
19 times. Let's try it:

```
$ caesar 7
VMY{vtxltkvbiaxkbltlnulmbmnmbhgvbiaxk}
CTF{caesarcipherisasubstitutioncipher}
```

And indeed, the flag is recovered.

## Security by Obscurity

Under construction... Come back later!

## Floppy 2

Under construction... Come back later!

## That's It for Now

That's all for now. I will certainly look into other challenges later. In the
meantime, why don't you go try those challenges out yourself?
