# First Look at Google CTF 2018

[The third annual Google CTF](https://security.googleblog.com/2018/05/google-ctf-2018-is-here.html)
took place on June 23, 2018. And the quests are now
available for everyone to try. The first few quests are very easy, so let's go!

## Letter

This is the first challenge and is extremely easy. The attached ZIP file
contains a PDF file, opening it shows a letter with username and password
blacked out. However, the text can be selected. Selecting and pasting
everything into an empty document reveals the password: `CTF{ICanReadDis}`.
And that is the flag.

## Floppy

Like before, the attachment is a ZIP file, opening it with 7-Zip shows that it
contains just one file: `foo.ico`. However, double-clicking on `foo.ico` would
open it like a folder, and reveals 2 files: `driver.txt` and `www.com`. Opening
`driver.txt`, it shows:

```
This is the driver for the Aluminum-Key Hardware password storage device.
     CTF{qeY80sU6Ktko8BJW}

In case of emergency, run www.com
```

And there is the flag.

## That's it for now

That's all for now. I will certainly look into other challenges later. In the
meantime, why don't you go try those challenges out yourself?
