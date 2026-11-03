---
title: 無効なトークンが続く範囲を、前後にたどって 1 つにまとめる
description: ZLS の tokenToLoc の無効なトークンの処理。1 バイトずつに分かれた無効なトークンを左右にたどり、文字の途中で切れない範囲を求める。
language: zig
project: ZLS
repo: https://github.com/zigtools/zls
license: MIT
copyright: Copyright (c) ZLS contributors
commit: "b3e65123f1bf455cea491ba7069bebd5f93e6839"
file: src/offsets.zig
lines: [408, 421]
function: tokenToLoc
difficulty: 3
format: 2
tags: [パース, 文字列処理, Unicode]
---

## ひとことで

`tokenToLoc` は、トークン（ソースコードを意味のある単位に切ったもの）の位置を、バイトの範囲で返す関数です。
この記事で扱うのは、その中の **無効なトークン（`invalid`）** の部分です。Zig のパーサーは、解釈できない文字を、1 バイトずつの無効なトークンにします。そのため、本当の範囲を知るには、隣の無効なトークンまで含めて範囲を広げる必要があります。

## コード

::: code-group

```zig:line-numbers=408 [日本語訳]
    } else if (tag == .invalid) {
    //     無効なトークンは 1 バイトずつなので、左右に走査して範囲を探す
    //     完全なコードの単位を含む、ソースの位置を見つける
    //     `tree.source` は有効な UTF-8 であることを前提にしている
        var begin = token_index;
        while (begin > 0 and tree.tokenTag(begin - 1) == .invalid) : (begin -= 1) {}

        var end = token_index;
        while (end < tree.tokens.len and tree.tokenTag(end) == .invalid) : (end += 1) {}
        return .{
            .start = tree.tokenStart(begin),
            .end = tree.tokenStart(end),
        };
    }
```

```zig:line-numbers=408 [原文]
    } else if (tag == .invalid) {
        // invalid tokens are one byte sized so we scan left and right to find the
        // source location that contains complete code units
        // this assumes that `tree.source` is valid utf8
        var begin = token_index;
        while (begin > 0 and tree.tokenTag(begin - 1) == .invalid) : (begin -= 1) {}

        var end = token_index;
        while (end < tree.tokens.len and tree.tokenTag(end) == .invalid) : (end += 1) {}
        return .{
            .start = tree.tokenStart(begin),
            .end = tree.tokenStart(end),
        };
    }
```

:::
## 前提知識

- **トークン（token）**: ソースコードを、キーワード、名前、記号などの単位に切ったものです。`Ast.TokenIndex` は、そのトークンの番号です。
- **`invalid` トークン**: パーサーが意味を読み取れなかった、1 バイト分のトークンです。日本語などの多バイトの文字は、バイトごとに分かれて無効なトークンになることがあります。
- **`tree.tokenStart(i)`**: トークン `i` の、ソースの中の開始位置を返す関数です。
- **UTF-8**: 1 文字が 1 から 4 バイトで表される文字コードです。途中のバイトだけを切り取ると、文字として意味をなしません。
- **`while (...) : (begin -= 1) {}`**: 条件が真の間、添字を減らしながら進める空の繰り返しです。
- **`tree.tokens.len`**: トークンの総数です。範囲の終わりを確かめるために使います。

## 何をしているか

### 1. 前方にたどる

```zig:line-numbers=412
        var begin = token_index;
        while (begin > 0 and tree.tokenTag(begin - 1) == .invalid) : (begin -= 1) {}
```

今のトークンから、前へ 1 つずつ戻ります。前のトークンも `invalid` である限り、範囲の始まりを前に広げます。`begin > 0` で、先頭を越えないようにしています。

### 2. 後方にたどる

```zig:line-numbers=415
        var end = token_index;
        while (end < tree.tokens.len and tree.tokenTag(end) == .invalid) : (end += 1) {}
```

同じように、後ろへ向かって `invalid` が続く間、範囲の終わりを広げます。`end < tree.tokens.len` で、トークンの末尾を越えないようにしています。

### 3. 開始と終了の位置を返す

```zig:line-numbers=417
        return .{
            .start = tree.tokenStart(begin),
            .end = tree.tokenStart(end),
        };
```

範囲の始まりは、一番前の無効なトークンの開始位置です。範囲の終わりは、一番後ろの無効なトークンの次のトークンの開始位置です。この形で、無効な部分がまるごと 1 つの範囲になります。

## ここがすごい

- **途中で切らない**: 1 バイトずつのトークンを個別に扱うと、文字の真ん中で範囲が切れてしまいます。隣をすべて含めることで、文字として意味のある範囲になります。
- **前提を明記**: コメントに、ソースが有効な UTF-8 であることを前提にしていると書かれています。前提が崩れる場合の扱いを、読む人が理解できます。
- **境界の確認が 2 か所**: 先頭と末尾の両方で、配列の範囲を越えない条件を入れています。無効なトークンだけが続く場合でも、安全に止まります。
- **通常のトークンと分けて扱う**: 無効なトークンだけに特別な処理を入れて、通常のトークンの経路には影響しない形です。

## まとめ

- 無効なトークンは 1 バイトずつに分かれるので、前後にたどって範囲を広げます。
- 前方と後方の両方で、範囲の外へ出ないよう確かめます。
- 範囲の終わりは、最後の無効なトークンの次の位置です。
- 文字の途中で範囲が切れないように、まとめて扱うのが目的です。
