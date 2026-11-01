---
title: 戻り値の型で 2 種類の strerror_r を見分ける
description: 同じ名前なのに GNU 版は char* を、XSI 版は int を返す strerror_r。auto と decltype で戻り値の型を調べ、どちらの環境でも 1 つのコードで正しく扱う。
language: cpp
project: Abseil
repo: https://github.com/abseil/abseil-cpp
license: Apache-2.0
commit: "4ce33a3b8a55d727ccb50d4134f869d1689039f2"
format: 2
copyright: Copyright 2020 The Abseil Authors.
file: absl/base/internal/strerror.cc
lines: [33, 52]
function: StrErrorAdaptor
difficulty: 2
tags: [移植性, 型システム, エラー処理]
---

## ひとことで

`StrErrorAdaptor` は、エラー番号（`errno` の値）を「No such file or directory」のような説明文に変換する関数です。
難しいのは、そのための C の関数 `strerror_r` に **同じ名前で 2 種類の仕様がある** ことです。この関数は、`auto` で受けた戻り値の **型そのもの** を調べて、どちらの仕様かを見分けます。

## コード

::: code-group

```cpp:line-numbers=33 [日本語訳]
const char* StrErrorAdaptor(int errnum, char* buf, size_t buflen) {
#if defined(_WIN32)
  int rc = strerror_s(buf, buflen, errnum);
  buf[buflen - 1] = '\0';  // NUL 終端を保証する
  if (rc == 0 && strncmp(buf, "Unknown error", buflen) == 0) *buf = '\0';
  return buf;
#else
  // `ret` の型はプラットフォームによって違う。どちらの枝も
  // 必ずコンパイルできなければならないが、各プラットフォームで実行されるのは片方だけ:
  auto ret = strerror_r(errnum, buf, buflen);
  if (std::is_same_v<decltype(ret), int>) {
    // XSI 版 `strerror_r`。`ret` は `int`:
    if (ret) *buf = '\0';
    return buf;
  } else {
    // GNU 版 `strerror_r`。`ret` は `char *`:
    return reinterpret_cast<const char*>(ret);
  }
#endif
}
```

```cpp:line-numbers=33 [原文]
const char* StrErrorAdaptor(int errnum, char* buf, size_t buflen) {
#if defined(_WIN32)
  int rc = strerror_s(buf, buflen, errnum);
  buf[buflen - 1] = '\0';  // guarantee NUL termination
  if (rc == 0 && strncmp(buf, "Unknown error", buflen) == 0) *buf = '\0';
  return buf;
#else
  // The type of `ret` is platform-specific; both of these branches must compile
  // either way but only one will execute on any given platform:
  auto ret = strerror_r(errnum, buf, buflen);
  if (std::is_same_v<decltype(ret), int>) {
    // XSI `strerror_r`; `ret` is `int`:
    if (ret) *buf = '\0';
    return buf;
  } else {
    // GNU `strerror_r`; `ret` is `char *`:
    return reinterpret_cast<const char*>(ret);
  }
#endif
}
```

:::

## 前提知識

- **`strerror_r` の 2 つの顔**:
  - XSI（POSIX）版: `int strerror_r(int, char* buf, size_t)`。説明文を `buf` に書き込み、成功なら 0 を返します。
  - GNU 版（glibc の既定）: `char* strerror_r(int, char* buf, size_t)`。説明文を指すポインタを返します。そのポインタは `buf` とは **別の場所**（静的な文字列）を指すこともあります。
- **`auto`**: 変数の型を、右辺の式から自動で決めます。ここでは、どちらの `strerror_r` が使われても受け取れます。
- **`decltype(ret)`**: 変数 `ret` の型を取り出します。
- **`std::is_same_v<A, B>`**: 型 `A` と `B` が同じなら `true` になる定数です。
- **`reinterpret_cast<const char*>(ret)`**: 値を別の型として解釈し直すキャストです。
- **`#if defined(_WIN32)`**: Windows 向けにコンパイルするときだけ有効になる部分です。

## 何をしているか

### 1. Windows の場合

```cpp:line-numbers=34
#if defined(_WIN32)
  int rc = strerror_s(buf, buflen, errnum);
  buf[buflen - 1] = '\0';  // NUL 終端を保証する
  if (rc == 0 && strncmp(buf, "Unknown error", buflen) == 0) *buf = '\0';
  return buf;
```

Windows には `strerror_s` という別の関数があります。結果を `buf` に書かせ、最後の文字を必ず `'\0'` にします。
`"Unknown error"` と返ってきたら、空文字列にしておきます。呼び出し元の `StrErrorInternal` が、空なら「Unknown error 番号」という独自の形式に作り直すからです。

### 2. それ以外: まず呼んでみる

```cpp:line-numbers=42
  auto ret = strerror_r(errnum, buf, buflen);
```

`auto ret = strerror_r(errnum, buf, buflen);` とだけ書きます。glibc なら `ret` は `char*`、それ以外の多くの環境では `int` になります。

### 3. 型で分岐する

```cpp:line-numbers=43
  if (std::is_same_v<decltype(ret), int>) {
    // XSI 版 `strerror_r`。`ret` は `int`:
    if (ret) *buf = '\0';
    return buf;
  } else {
    // GNU 版 `strerror_r`。`ret` は `char *`:
    return reinterpret_cast<const char*>(ret);
  }
```

- `ret` が `int` なら XSI 版です。説明文は `buf` に入っています。失敗（0 以外）なら `buf` を空にしてから `buf` を返します。
- そうでなければ GNU 版です。`ret` そのものが説明文を指すポインタなので、それを返します。

`errnum = 2` で glibc の場合、`ret` は `"No such file or directory"` を指す `char*` で、その文字列が返ります。

## ここがすごい

- **`#ifdef` の迷路を避ける**: 素直に書くと「`_GNU_SOURCE` が定義されていて、かつ glibc で…」のようなマクロの条件を並べることになります。条件を間違えるとコンパイルが通っても結果が化けます。戻り値の型で判定すれば、**実際に呼ばれた関数** の仕様に確実に従えます。
- **両方の枝がコンパイルできる書き方**: コードのコメントのとおり、ここは普通の `if` なので、両方の枝がコンパイルされます。`int` の場合の `reinterpret_cast<const char*>(ret)` も、`char*` の場合の `if (ret)` も、型として成立する式です。だから 1 つのコードがどちらの環境でもビルドできます。条件はコンパイル時に決まる定数なので、使われない枝は最適化で消えます。
- **GNU 版の罠を踏まない**: GNU 版は `buf` に書かずに静的な文字列を返すことがあります。`buf` を見るのではなく戻り値のポインタを返しているので、その場合も正しく動きます。
- **失敗を「空文字列」にそろえる**: どの環境でも、失敗したら空文字列を返すという約束にそろえています。呼び出し元は空かどうかだけを見ればよく、環境差を意識せずに済みます。

## まとめ

- 同じ名前で仕様が違う API は、戻り値の型を `decltype` で調べると確実に見分けられる。
- 両方の枝が型として成り立つように書けば、普通の `if` でも環境ごとに使い分けられる。
- 環境ごとの違いは小さな関数に閉じ込め、外には統一した約束（失敗なら空）だけを見せる。
- GNU 版 `strerror_r` は渡したバッファを使わないことがある。戻り値を使うのが正しい。
