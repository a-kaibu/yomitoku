---
title: 1 の最初のバイトを見てエンディアンを判定する
description: 実行中の CPU がビッグエンディアンかを返す関数。まずコンパイラの定義済みマクロで判定し、わからないときだけ整数 1 のバイト並びを実際に調べる。
language: cpp
project: "{fmt}"
repo: https://github.com/fmtlib/fmt
license: MIT
copyright: "Copyright (c) 2012 - present, Victor Zverovich and {fmt} contributors"
commit: "4ed3535092a96ac9f56fab80df83416d51bcc78e"
file: include/fmt/format.h
lines: [273, 286]
function: detail::is_big_endian
difficulty: 1
format: 2
tags: [移植性, 低レイヤ, マクロ]
---

## ひとことで

`is_big_endian()` は、CPU が **ビッグエンディアン** なら `true` を返します。

エンディアンとは、複数バイトの整数をメモリにどの順で並べるかの決まりです。`0x01020304` を、大きい桁から `01 02 03 04` と並べるのがビッグエンディアン、小さい桁から `04 03 02 01` と並べるのがリトルエンディアンです。x86 や多くの ARM はリトルエンディアンです。

## コード

```cpp:line-numbers=273
inline auto is_big_endian() -> bool {
#ifdef _WIN32
  return false;
#elif defined(__BIG_ENDIAN__)
  return true;
#elif defined(__BYTE_ORDER__) && defined(__ORDER_BIG_ENDIAN__)
  return __BYTE_ORDER__ == __ORDER_BIG_ENDIAN__;
#else
  struct bytes {
    char data[sizeof(int)];
  };
  return bit_cast<bytes>(1).data[0] == 0;
#endif
}
```

## 前提知識

- **プリプロセッサの `#ifdef` / `#elif` / `#else`**: コンパイル前に、条件に合う 1 か所だけを残してほかを消す仕組みです。この関数は環境によって中身がまったく別物になります。
- **定義済みマクロ**: `_WIN32` は Windows、`__BYTE_ORDER__` は GCC や Clang がバイト順を教えてくれるマクロです。コンパイラが自動で定義します。
- **`struct bytes { char data[sizeof(int)]; };`**: 関数の中で、`int` と同じ大きさの文字配列を持つ構造体を定義しています。
- **`bit_cast<bytes>(1)`**: 整数 `1` のメモリ上のバイト列を、そのまま `bytes` として取り出します（同じファイルの `bit_cast` 関数）。
- **`.data[0]`**: 構造体のメンバ `data` の 0 番目、つまりメモリの先頭のバイトです。

## 何をしているか

### 1. 既知の環境はコンパイル時に決める

```cpp:line-numbers=274
#ifdef _WIN32
  return false;
#elif defined(__BIG_ENDIAN__)
  return true;
#elif defined(__BYTE_ORDER__) && defined(__ORDER_BIG_ENDIAN__)
  return __BYTE_ORDER__ == __ORDER_BIG_ENDIAN__;
```

- Windows がサポートしている CPU はすべてリトルエンディアンなので、`false` に決め打ちします。
- `__BIG_ENDIAN__` が定義されていれば `true` です。
- GCC / Clang なら `__BYTE_ORDER__` と `__ORDER_BIG_ENDIAN__` を比べるだけです。

これらの場合、関数は定数を返すだけになり、実行時の判定は残りません。

### 2. わからなければ実際に調べる

```cpp:line-numbers=280
#else
  struct bytes {
    char data[sizeof(int)];
  };
  return bit_cast<bytes>(1).data[0] == 0;
```

整数 `1` は 4 バイトなら `0x00000001` です。

- リトルエンディアン: メモリは `01 00 00 00`。先頭バイトは `1`。
- ビッグエンディアン: メモリは `00 00 00 01`。先頭バイトは `0`。

だから `data[0] == 0` ならビッグエンディアンだと判断できます。

## ここがすごい

- **速い道と確実な道の 2 段構え**: コンパイラが答えを知っているなら、それを使って定数にします。知らない珍しい環境でも、最後の手段で必ず正しい答えが出ます。
- **ポインタのキャストを使わない**: 昔からある書き方は `*(char*)&x` ですが、{fmt} は自前の `bit_cast`（`memcpy` ベース）で読み替えています。型の規則に違反しない安全な方法です。
- **関数内の小さな構造体**: 使う場所の中でだけ `bytes` を定義し、外に名前を漏らしていません。
- **どこで使われるか**: 異なるサイズどうしの `bit_cast` や、時刻の 8 バイトを一度に書く `write_digit2_separated`（chrono.h）が、この結果でバイト順を調整しています。

## まとめ

- エンディアンは「多バイト整数のバイトをメモリにどの順で置くか」の違い。
- 整数 1 の先頭バイトを見れば、実行時にエンディアンを判定できる。
- コンパイラの定義済みマクロで分かる場合は、コンパイル時に決めて実行時コストを消す。
- メモリの読み替えは、ポインタのキャストではなく `memcpy` 系の方法で行う。
