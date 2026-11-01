---
title: 「\n\r」には You monster! と書かれた改行コード判定
description: 文字列に含まれる改行コードの種類を判定する小さな関数です。最初の \r の前後だけを見て、Unix・Windows・古い Mac・逆順の 4 通りを見分けます。
language: cpp
project: LLVM
repo: https://github.com/llvm/llvm-project
license: Apache-2.0 WITH LLVM-exception
copyright: Part of the LLVM Project, under the Apache License v2.0 with LLVM Exceptions.
commit: "384a71b8a2d99b5deb82792c23202c2b82b8ed82"
file: llvm/include/llvm/ADT/StringRef.h
lines: [860, 877]
function: StringRef::detectEOL
difficulty: 1
format: 2
tags: [文字列処理, 移植性, 可読性]
---

## ひとことで

`detectEOL` は、文字列の中で使われている **改行コード（行末の印）の種類** を調べて、その改行コードそのものを返します。
`"a\r\nb"` なら `"\r\n"`（Windows 式）、`"a\nb"` なら `"\n"`（Unix 式）です。テキストを書き直すとき、元のファイルと同じ改行コードを使いたい場面で役立ちます。

## コード

::: code-group

```cpp:line-numbers=860 [日本語訳]
  /// 文字列の改行コードの流儀を判定する。
  ///
  /// 文字列に改行が含まれていれば、検出した改行の文字並びを返す。
  /// そうでなければ Unix の改行として '\n' を返す。
  ///
  /// \return - 改行コードの文字並び。
  [[nodiscard]] StringRef detectEOL() const {
    size_t Pos = find('\r');
    if (Pos == npos) {
      // キャリッジリターンがなければ Unix とみなす
      return "\n";
    }
    if (Pos + 1 < size() && data()[Pos + 1] == '\n')
      return "\r\n"; // Windows 式
    if (Pos > 0 && data()[Pos - 1] == '\n')
      return "\n\r"; // この怪物め！
    return "\r";     // 昔の Mac
  }
```

```cpp:line-numbers=860 [原文]
  /// Detect the line ending style of the string.
  ///
  /// If the string contains a line ending, return the line ending character
  /// sequence that is detected. Otherwise return '\n' for unix line endings.
  ///
  /// \return - The line ending character sequence.
  [[nodiscard]] StringRef detectEOL() const {
    size_t Pos = find('\r');
    if (Pos == npos) {
      // If there is no carriage return, assume unix
      return "\n";
    }
    if (Pos + 1 < size() && data()[Pos + 1] == '\n')
      return "\r\n"; // Windows
    if (Pos > 0 && data()[Pos - 1] == '\n')
      return "\n\r"; // You monster!
    return "\r";     // Classic Mac
  }
```

:::

## 前提知識

- **改行コード**: 行の終わりを示す文字です。`\n`（LF、ラインフィード）と `\r`（CR、キャリッジリターン）の 2 種類があり、OS によって組み合わせが違います。
  - Unix / Linux / 今の macOS: `\n`
  - Windows: `\r\n`
  - 昔の Mac（Mac OS 9 まで）: `\r`
- **StringRef**: 文字列の先頭の住所と長さを持つ軽い参照です。`data()` で先頭の住所、`size()` で長さが取れます。
- **`find(c)`**: 文字 `c` が最初に出てくる位置を返します。見つからなければ `npos` という特別な値を返します。
- **`data()[i]`**: 先頭から `i` 番目の文字です。
- **文字列リテラルから StringRef への変換**: `return "\n";` のように書くと、`"\n"` が自動で StringRef に変換されます。リテラルはプログラムの最後まで消えないので、返しても安全です。

## 何をしているか

### 1. `\r` がなければ Unix 式

```cpp:line-numbers=867
    size_t Pos = find('\r');
    if (Pos == npos) {
      // キャリッジリターンがなければ Unix とみなす
      return "\n";
    }
```

`find('\r')` で最初の `\r` を探します。見つからなければ、`\n` だけの Unix 式と見なします。
改行が 1 つもない文字列でも `"\n"` を返します。関数の前のコメントにある通り、「わからなければ Unix 式」が既定です。

### 2. `\r` の直後が `\n` なら Windows 式

```cpp:line-numbers=872
    if (Pos + 1 < size() && data()[Pos + 1] == '\n')
      return "\r\n"; // Windows 式
```

`"a\r\nb"` では `\r` が 1 番目にあり、2 番目が `\n` なので `"\r\n"` を返します。
`Pos + 1 < size()` を先に確かめているので、`\r` が末尾にあっても範囲外を読みません。

### 3. `\r` の直前が `\n` なら逆順

```cpp:line-numbers=874
    if (Pos > 0 && data()[Pos - 1] == '\n')
      return "\n\r"; // この怪物め！
```

`"a\n\rb"` のように `\n\r` の順になっている場合です。とてもまれで、コメントには **「You monster!（この怪物め！）」** と書かれています。
ここでも `Pos > 0` を先に確かめて、先頭より前を読まないようにしています。

### 4. それ以外は古い Mac 式

```cpp:line-numbers=876
    return "\r";     // 昔の Mac
```

`\r` があって前後に `\n` がなければ、`\r` だけの古い Mac 式です。

## ここがすごい

- **全部を数えない**: 文字列全体の改行を数えて多数決をとる方法もありますが、この関数は最初の `\r` の周りだけを見ます。1 つのファイルの中では改行コードは揃っていることが多いので、これで十分という割り切りです。
- **`\r` を探すのが賢い**: `\n` は Unix 式・Windows 式の両方に出てきますが、`\r` は Unix 式には出てきません。`\r` を手がかりにすると、1 回の検索で 4 通りに分けられます。
- **範囲チェックを条件の先頭に置く**: `&&` は左が偽なら右を評価しません。だから「添字が範囲内か」を左に書けば、範囲外アクセスが起きません。
- **ユーモアのあるコメント**: 実用的な小関数ですが、各分岐にどの OS 向けかがコメントで添えられていて、意図がすぐわかります。

## まとめ

- 改行コードには `\n`、`\r\n`、`\r` などの流儀がある。
- 種類を見分けるには、全員に共通しない文字（ここでは `\r`）を手がかりにするとよい。
- `&&` の左側で範囲チェックをすれば、右側で安全に添字アクセスできる。
- 判定できないときの既定値を決めておくと、呼び出し側が楽になる。

