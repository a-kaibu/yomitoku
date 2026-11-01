---
title: "関数の中で errno を壊さないための PROTECT_ERRNO"
description: "後片付けの途中で呼んだ関数が errno を上書きしてしまう問題を、1 行の宣言で防ぐ。cleanup 属性で、スコープを抜けるときに元の値へ戻す。"
language: c
project: systemd
repo: https://github.com/systemd/systemd
license: LGPL-2.1-or-later
copyright: "Copyright (C) the systemd authors"
commit: "86025ff125b025390ba869f3ae0fbce9bdbcdb9c"
file: src/basic/errno-util.h
lines: [22, 40]
function: "PROTECT_ERRNO"
difficulty: 2
format: 2
tags: [エラー処理, イディオム, マクロ, システムコール]
---

## ひとことで

`PROTECT_ERRNO;` と 1 行書くと、そのスコープの中で何をしても、**抜けるときに `errno` が元の値に戻ります**。
たとえばエラー処理の途中でファイルを閉じたりログを書いたりすると、その関数が `errno` を書き換えてしまい、本来のエラー原因がわからなくなります。それを防ぐ仕組みです。

## コード

::: code-group

```c:line-numbers=22 [日本語訳]
static inline void _reset_errno_(int *saved_errno) {
        if (*saved_errno < 0) /* UNPROTECT_ERRNO で無効化された？ */
                return;

        errno = *saved_errno;
}

#define PROTECT_ERRNO                           \
        _cleanup_(_reset_errno_) _unused_ int _saved_errno_ = errno

#define UNPROTECT_ERRNO                         \
        do {                                    \
                errno = _saved_errno_;          \
                _saved_errno_ = -1;             \
        } while (false)

#define LOCAL_ERRNO(value)                      \
        PROTECT_ERRNO;                          \
        errno = ABS(value)
```

```c:line-numbers=22 [原文]
static inline void _reset_errno_(int *saved_errno) {
        if (*saved_errno < 0) /* Invalidated by UNPROTECT_ERRNO? */
                return;

        errno = *saved_errno;
}

#define PROTECT_ERRNO                           \
        _cleanup_(_reset_errno_) _unused_ int _saved_errno_ = errno

#define UNPROTECT_ERRNO                         \
        do {                                    \
                errno = _saved_errno_;          \
                _saved_errno_ = -1;             \
        } while (false)

#define LOCAL_ERRNO(value)                      \
        PROTECT_ERRNO;                          \
        errno = ABS(value)
```

:::

## 前提知識

- **`errno`**: C の標準ライブラリやシステムコール（OS に処理を頼む関数）が失敗したとき、原因の番号を書き込むグローバルな変数です。`open` が失敗すれば `errno` に `ENOENT`（ファイルがない）などが入ります。成功した関数が `errno` を変えることもあるので、すぐに読み取る必要があります。
- **ポインタ `int *`**: `int *saved_errno` は「`int` の置き場所」を指し、`*saved_errno` でその中身を読み書きします。
- **`_cleanup_(f)`**: systemd のマクロで、GCC/Clang の `__attribute__((cleanup(f)))` です。付けた変数がスコープを抜けるとき、`f(&変数)` が自動で呼ばれます。
- **`_unused_`**: 「使われていない変数」という警告を出さないための属性です。
- **`do { ... } while (false)`**: 複数の文を 1 つの文として扱うための包み方です。
- **`ABS(x)`**: 絶対値を返す systemd のマクロです。systemd では負のエラー番号（`-ENOENT` など）を使うので、`errno` に入れるときに正の値に直します。

## 何をしているか

### 1. 元に戻す関数

```c:line-numbers=22
static inline void _reset_errno_(int *saved_errno) {
        if (*saved_errno < 0) /* Invalidated by UNPROTECT_ERRNO? */
                return;

        errno = *saved_errno;
}
```

`_reset_errno_` は、保存しておいた値を `errno` に書き戻します。ただし保存値が負なら何もしません。負の値は「戻す必要がない」という目印です（後述の `UNPROTECT_ERRNO` で使います）。

### 2. 保存して、抜けるときに戻す

```c:line-numbers=29
#define PROTECT_ERRNO                           \
        _cleanup_(_reset_errno_) _unused_ int _saved_errno_ = errno
```

`PROTECT_ERRNO` は宣言 1 つに展開されます。宣言した時点の `errno` を `_saved_errno_` に保存し、スコープを抜けるときに `_reset_errno_(&_saved_errno_)` が呼ばれて元に戻ります。
たとえば `errno` が `EACCES`（権限がない）のときに `PROTECT_ERRNO;` を書き、その後 `close` が `errno` を `EBADF` に変えても、関数を抜けると `EACCES` に戻ります。

### 3. 保護をやめる

```c:line-numbers=32
#define UNPROTECT_ERRNO                         \
        do {                                    \
                errno = _saved_errno_;          \
                _saved_errno_ = -1;             \
        } while (false)
```

`UNPROTECT_ERRNO` は、保存値を今すぐ `errno` に戻したうえで、`_saved_errno_` を `-1` にします。
こうすると、スコープを抜けるときの `_reset_errno_` は何もせず帰るので、その後に設定した `errno` がそのまま呼び出し元に届きます。

### 4. 一時的に別の値を入れる

```c:line-numbers=38
#define LOCAL_ERRNO(value)                      \
        PROTECT_ERRNO;                          \
        errno = ABS(value)
```

`LOCAL_ERRNO(value)` は、`PROTECT_ERRNO` で保護したうえで `errno` に `value` を入れます。スコープの中だけ `errno` を一時的に差し替えたい場合（`%m` で errno を表示するログ関数に、特定のエラーを渡したいときなど）に使います。

## ここがすごい

- **1 行で「この関数は errno に触らない」を約束できる**: たとえば `safe_close()` は、コメントで「errno を変えないことを保証する」とうたっています。その実装は、関数の中で `PROTECT_ERRNO;` を書くだけです。保存と復元の 2 行を手で書くと、途中の `return` で復元を忘れるおそれがありますが、cleanup 属性ならどの出口でも戻ります。
- **名前が固定なのにも理由がある**: 変数名を `_saved_errno_` と固定にしてあるので、`UNPROTECT_ERRNO` がその変数を名前で参照できます。ただし同じスコープで 2 回 `PROTECT_ERRNO` を書くと名前がぶつかるので、1 スコープに 1 回、という使い方になります。
- **「戻さない」目印に負の値を使う**: `errno` は常に 0 以上なので、`-1` を「無効」の印にできます。フラグ用の変数をもう 1 つ増やさずに済む、小さな工夫です。
- **後片付けのコードを安全にする**: エラー処理の途中で呼ぶ `close` や `free`、ログ出力などは、それ自体が `errno` を変えることがあります。こうした「おまけの処理」の内側で `PROTECT_ERRNO` を使えば、呼び出し元が見る `errno` は本来の失敗の原因のまま保たれます。

## まとめ

- `errno` は多くの関数が書き換えるので、エラーの原因を保つには退避と復元が必要。
- `PROTECT_ERRNO` は、宣言時に `errno` を保存し、cleanup 属性でスコープの出口で元に戻す。
- 保存値を `-1` にすると「戻さない」という意味になり、`UNPROTECT_ERRNO` で保護を解除できる。
- 後片付けの関数を「errno に影響しない」ものにでき、呼び出し側のエラー処理が単純になる。
