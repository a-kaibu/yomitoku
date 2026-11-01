---
title: "「取り出して空にする」を 1 式で書く TAKE_PTR"
description: "Rust の Option::take() に倣ったマクロ。ポインタを返しつつ元の変数を NULL にすることで、自動解放（_cleanup_）と所有権の受け渡しを両立させる。"
language: c
project: systemd
repo: https://github.com/systemd/systemd
license: LGPL-2.1-or-later
copyright: "Copyright (C) the systemd authors"
commit: "86025ff125b025390ba869f3ae0fbce9bdbcdb9c"
file: src/fundamental/macro.h
lines: [420, 433]
function: "TAKE_PTR"
difficulty: 2
format: 2
tags: [メモリ管理, マクロ, イディオム]
---

## ひとことで

`TAKE_PTR(p)` は、変数 `p` の中身を **返しつつ、`p` 自身は `NULL` にする** マクロです。
`return TAKE_PTR(buf);` と書けば、「`buf` は呼び出し元に渡すので、スコープを抜けても自動で解放しないで」という意味になります。
コメントにあるとおり、Rust の `Option::take()` から着想を得ています。

## コード

::: code-group

```c:line-numbers=420 [日本語訳]
/* Rust の Option::take() メソッドに着想を得たもの: ポインタを読み出して返すと同時に、
 * それを NULL に戻す。参照: https://doc.rust-lang.org/std/option/enum.Option.html#method.take */
#define TAKE_GENERIC(var, type, nullvalue)                       \
        ({                                                       \
                type *_pvar_ = &(var);                           \
                type _var_ = *_pvar_;                            \
                type _nullvalue_ = nullvalue;                    \
                *_pvar_ = _nullvalue_;                           \
                _var_;                                           \
        })
#define TAKE_PTR_TYPE(ptr, type) TAKE_GENERIC(ptr, type, NULL)
#define TAKE_PTR(ptr) TAKE_PTR_TYPE(ptr, typeof(ptr))
#define TAKE_STRUCT_TYPE(s, type) TAKE_GENERIC(s, type, {})
#define TAKE_STRUCT(s) TAKE_STRUCT_TYPE(s, typeof(s))
```

```c:line-numbers=420 [原文]
/* Takes inspiration from Rust's Option::take() method: reads and returns a pointer, but at the same time
 * resets it to NULL. See: https://doc.rust-lang.org/std/option/enum.Option.html#method.take */
#define TAKE_GENERIC(var, type, nullvalue)                       \
        ({                                                       \
                type *_pvar_ = &(var);                           \
                type _var_ = *_pvar_;                            \
                type _nullvalue_ = nullvalue;                    \
                *_pvar_ = _nullvalue_;                           \
                _var_;                                           \
        })
#define TAKE_PTR_TYPE(ptr, type) TAKE_GENERIC(ptr, type, NULL)
#define TAKE_PTR(ptr) TAKE_PTR_TYPE(ptr, typeof(ptr))
#define TAKE_STRUCT_TYPE(s, type) TAKE_GENERIC(s, type, {})
#define TAKE_STRUCT(s) TAKE_STRUCT_TYPE(s, typeof(s))
```

:::

## 前提知識

- **ポインタと `&`、`*`**: `&var` は変数 `var` のアドレス（置き場所）を取り出す演算子、`*p` はポインタ `p` が指す場所の中身です。`type *_pvar_ = &(var);` は「`var` の置き場所」を覚えておく変数です。
- **`_cleanup_free_`**: systemd で多用される属性で、付けた変数はスコープを抜けると自動で `free` されます。中身が `NULL` なら何もしません。
- **所有権**: 「このメモリを最後に解放する責任を持つのは誰か」という考え方です。C の言語仕様にはありませんが、プログラマが頭の中で管理します。
- **`typeof(x)`**: GCC/Clang の拡張で、式 `x` の型をそのまま型名として使えます。`typeof(ptr)` は `ptr` が `char *` なら `char *` です。
- **`({ ... })`（文式）**: GCC 拡張で、`{ }` の中の文を順に実行し、最後の式の値を全体の値にします。マクロの中で一時変数を使いたいときの定番です。
- **構造体の `{}` 初期化**: `{}` は「全メンバを 0 にした値」を表します（C23 で正式になり、GCC は以前から拡張として受け付けます）。

## 何をしているか

### 1. 汎用版 TAKE_GENERIC

```c:line-numbers=422
#define TAKE_GENERIC(var, type, nullvalue)                       \
        ({                                                       \
                type *_pvar_ = &(var);                           \
                type _var_ = *_pvar_;                            \
                type _nullvalue_ = nullvalue;                    \
                *_pvar_ = _nullvalue_;                           \
                _var_;                                           \
        })
```

`TAKE_GENERIC(var, type, nullvalue)` は 4 つの文からなる文式です。

1. `type *_pvar_ = &(var);` で `var` のアドレスを保存します。
2. `type _var_ = *_pvar_;` で今の中身をコピーします。
3. `type _nullvalue_ = nullvalue;` で「空の値」を用意します。
4. `*_pvar_ = _nullvalue_;` で元の変数に空の値を書き込みます。

最後の `_var_;` が文式全体の値になるので、マクロは **書き換える前の値** を返します。

たとえば `char *s` が `0x5000` を指しているとき、`char *t = TAKE_PTR(s);` を実行すると `t` は `0x5000`、`s` は `NULL` になります。

### 2. 用途別の短い名前

```c:line-numbers=430
#define TAKE_PTR_TYPE(ptr, type) TAKE_GENERIC(ptr, type, NULL)
#define TAKE_PTR(ptr) TAKE_PTR_TYPE(ptr, typeof(ptr))
#define TAKE_STRUCT_TYPE(s, type) TAKE_GENERIC(s, type, {})
#define TAKE_STRUCT(s) TAKE_STRUCT_TYPE(s, typeof(s))
```

- `TAKE_PTR(ptr)`: ポインタ用。空の値は `NULL`、型は `typeof(ptr)` で自動的に決まります。
- `TAKE_STRUCT(s)`: 構造体用。空の値は `{}`（全メンバ 0）です。

`TAKE_PTR_TYPE(ptr, type)` のように型を明示できる版もあり、`typeof` だけでは都合が悪い場面に備えています。

### 使い方の例

```c
_cleanup_free_ char *buf = NULL;
buf = malloc(100);
if (!buf)
        return -ENOMEM;
if (fill(buf) < 0)
        return -EIO;          /* ここで抜けると buf は自動で free */
*ret = TAKE_PTR(buf);         /* 成功時は所有権を呼び出し元へ */
return 0;
```

## ここがすごい

- **自動解放と相性が抜群**: `_cleanup_free_` だけだと、成功時に呼び出し元へ返したいメモリまで解放されてしまいます。`TAKE_PTR` で変数を `NULL` にすると後片付けが空振りになり、「失敗時は解放、成功時は渡す」がとても自然に書けます。
- **1 式で書ける**: 素直に書くと `*ret = buf; buf = NULL;` の 2 行で、後ろの `buf = NULL;` を書き忘れると二重解放（同じメモリを 2 回 free する重大なバグ）になります。1 つの式にまとめることで、忘れようがなくなります。
- **引数の評価は 1 回だけ**: `&(var)` を一度だけ取り、以降はそのポインタ経由で読み書きします。マクロの引数を何度も展開すると、副作用のある式で予想外の動作になることがありますが、それを避けています。
- **型を問わない**: `type` を引数にしてあるので、ポインタでも構造体でも、さらにはファイルディスクリプタ用の `TAKE_FD`（空の値が `-EBADF`）のような派生も同じ仕組みで作れます。
- **トレードオフ**: `typeof` と文式は GCC/Clang の拡張なので、標準 C だけでは書けません。

## まとめ

- `TAKE_PTR(p)` は「`p` の値を返し、`p` を `NULL` にする」を 1 式で行う。
- `_cleanup_` による自動解放と組み合わせると、所有権の受け渡しが明確になる。
- 2 行に分けて書いたときの「NULL 代入忘れ」による二重解放を防げる。
- 空の値を引数にした汎用版から、用途別の短いマクロを作る設計になっている。
