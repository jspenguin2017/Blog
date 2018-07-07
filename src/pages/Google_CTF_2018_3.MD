# (Title TODO)

(Intro TODO)

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
suspicious, what's the content of `FLAG`?

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
    while (i--) { // Takes care of endianness
        process.stdout.write(String.fromCharCode(w[i] ^ 0xc7));
    }
}
```

The content can be easily read out from Hopper Disassembler, but it's not
readable text. However, it's clearly the flag after XOR-ing each byte with
`0xc7`: `CTF{Two_PasSworDz_Better_th4n_1_k?}`.

I'm not sure if it's a bug or intentional, but it would make more sense if the
`secondary_login` function actually validated the input. `shell` is disabled,
but can it be enabled with some hacking?
