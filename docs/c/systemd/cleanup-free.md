---
title: "C に「スコープを抜けたら自動で free」を持ち込む _cleanup_free_"
description: "systemd のコードに必ず出てくる _cleanup_free_ の正体。GCC の cleanup 属性と 1 行の関数 freep で、C に自動解放の仕組みを作っている。"
language: c
project: systemd
repo: https://github.com/systemd/systemd
license: LGPL-2.1-or-later
copyright: "Copyright (C) the systemd authors"
commit: "86025ff125b025390ba869f3ae0fbce9bdbcdb9c"
file: src/basic/alloc-util.h
lines: [71, 82]
function: "freep / _cleanup_free_"
difficulty: 1
format: 2
tags: [メモリ管理, イディオム, マクロ, エラー処理]
---

## ひとことで

`_cleanup_free_` は、systemd のソースのほぼすべてのファイルに登場するおまじないです。
`_cleanup_free_ char *s = NULL;` と宣言しておくと、変数 `s` が **スコープ（`{ }` の範囲）を抜けるとき自動的に `free(s)` が呼ばれます**。
C には C++ のデストラクタや Go の `defer` のような仕組みがありませんが、GCC と Clang の拡張機能を使ってそれを実現しています。

## コード

::: code-group

```c:line-numbers=71 [日本語訳]
static inline void unsetp(void *p) {
        /* _cleanup_ 関数からポインタを未設定に戻したい場合に使える、
         * ごく単純な「デストラクタ」。 */

        *(void**)p = NULL;
}

static inline void freep(void *p) {
        *(void**)p = mfree(*(void**) p);
}

#define _cleanup_free_ _cleanup_(freep)
```

```c:line-numbers=71 [原文]
static inline void unsetp(void *p) {
        /* A trivial "destructor" that can be used in cases where we want to
         * unset a pointer from a _cleanup_ function. */

        *(void**)p = NULL;
}

static inline void freep(void *p) {
        *(void**)p = mfree(*(void**) p);
}

#define _cleanup_free_ _cleanup_(freep)
```

:::

`freep` が使っている `mfree` と、`_cleanup_` は `src/fundamental/macro.h` で次のように定義されています。

<!-- source: src/fundamental/macro.h -->
```c:line-numbers=446
#define mfree(memory)                           \
        ({                                      \
                free(memory);                   \
                (typeof(memory)) NULL;          \
        })
```

<!-- source: src/fundamental/macro.h -->
```c:line-numbers=80
#define _cleanup_(x) __attribute__((__cleanup__(x)))
```

## 前提知識

- **`malloc` と `free`**: C ではヒープ（プログラムが自由に確保できるメモリ領域）のメモリを `malloc` で借り、使い終わったら `free` で返します。返し忘れると「メモリリーク」になります。C には自動で回収してくれるガベージコレクタはありません。
- **ポインタ**: メモリ上の場所（アドレス）を入れる変数です。`char *s` は「文字が置いてある場所」を持つ変数で、`*s` と書くとその場所の中身を読めます。
- **ポインタのポインタ `void **`**: 「ポインタ変数そのものの場所」を指すポインタです。`*(void**)p` は「`p` が指しているポインタ変数の中身」を意味します。
- **`void *`**: 型を決めない汎用ポインタです。どんな型のポインタでも代入できます。
- **`static inline`**: `static` は「このファイルの中だけで見える」、`inline` は「呼び出し箇所に展開してよい」という指示です。ヘッダファイルに小さな関数を書くときの定番です。
- **マクロ `#define`**: コンパイル前に文字列を置き換える仕組みです。`_cleanup_free_` と書くと `__attribute__((__cleanup__(freep)))` に置き換わります。
- **`__attribute__((__cleanup__(f)))`**: GCC/Clang の拡張です。この属性を付けたローカル変数がスコープを抜けるとき、コンパイラが自動で `f(&変数)` を呼び出すコードを挿入します。引数は **変数のアドレス** である点が大切です。
- **`({ ... })`（文式）**: GCC 拡張で、複数の文をまとめて 1 つの式にし、最後の式の値をその値にします。

## 何をしているか

### 1. unsetp: ポインタを NULL にするだけの「後片付け」

```c:line-numbers=71
static inline void unsetp(void *p) {
        /* A trivial "destructor" that can be used in cases where we want to
         * unset a pointer from a _cleanup_ function. */

        *(void**)p = NULL;
}
```

`unsetp` は受け取った場所にあるポインタを `NULL` にするだけです。何も解放しません。
「スコープを抜けるときにポインタを無効化しておきたい」という特殊な場面のために用意されています。
引数が `void *p` なのは、cleanup 属性から渡される「変数のアドレス」をどんな型でも受け取れるようにするためです。

### 2. freep: 解放して NULL を書き戻す

```c:line-numbers=78
static inline void freep(void *p) {
        *(void**)p = mfree(*(void**) p);
}
```

`freep` の本体は 1 行です。`*(void**) p` で「変数に入っているポインタ」を取り出し、`mfree` に渡します。
`mfree` は `free` を呼んだあと `NULL` を返すマクロなので、変数には `NULL` が書き戻されます。

たとえば `char *s` が `0x5000` 番地を指しているとき、cleanup 属性はスコープの終わりで `freep(&s)` を呼びます。
`freep` の中で `*(void**)&s` は `0x5000` なので、`free(0x5000)` が実行され、`s` は `NULL` になります。
`s` が最初から `NULL` のままなら、`free(NULL)` は C の規格上「何もしない」と決まっているので安全です。

### 3. _cleanup_free_: 名前を付けて使いやすくする

```c:line-numbers=82
#define _cleanup_free_ _cleanup_(freep)
```

最後に `_cleanup_(freep)` に `_cleanup_free_` という短い名前を付けています。使う側はこう書きます。

```c
_cleanup_free_ char *path = NULL;
path = strdup("/etc/hostname");
if (!path)
        return -ENOMEM;
/* ... どこで return しても path は自動で free される ... */
```

## ここがすごい

- **早期 return と相性がよい**: 素直な C では、エラーで途中 `return` するたびに `free` を書くか、`goto fail;` で 1 か所に集めます。`_cleanup_free_` なら、関数のどこで `return` しても解放が保証されるので、エラー処理が 1 行の `return -errno;` で済みます。systemd のコードが短く読みやすいのはこのおかげです。
- **NULL 初期化との組み合わせ**: 宣言時に `= NULL` にしておけば、確保に失敗しても解放は `free(NULL)` で無害です。「確保に成功したかどうか」を後片付け側で気にする必要がありません。
- **関数 1 つで全部の型に対応**: `freep` は `void *` を受け取り `void **` として読むので、`char *` でも構造体ポインタでも同じ関数で扱えます。
- **トレードオフ**: GCC/Clang の拡張なので、標準 C だけをサポートするコンパイラでは使えません。systemd は Linux 専用で GCC/Clang 前提なので、この割り切りが成立しています。また、所有権を呼び出し元に渡したいときは「自動で解放されては困る」ので、別のマクロ `TAKE_PTR` で変数を `NULL` にしてから返します。

## まとめ

- `__attribute__((cleanup(f)))` を付けた変数は、スコープを抜けると `f(&変数)` が自動で呼ばれる。
- `freep` は「変数のアドレス」を受け取り、中身を `free` して `NULL` を書き戻す。
- 宣言時に `NULL` で初期化しておくと、どの経路で抜けても安全に解放される。
- 早期 return が多いエラー処理を、`goto` なしで短く書けるようになる。
