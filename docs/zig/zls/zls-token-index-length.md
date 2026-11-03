---
title: トークンの番号から、そのトークンの長さを求める
description: ZLS の tokenIndexLength。トークンの番号を範囲（Loc）に直してから、エンコーディングに従った文字数の長さを返す。位置の変換を組み合わせる小さな関数。
language: zig
project: ZLS
repo: https://github.com/zigtools/zls
license: MIT
copyright: Copyright (c) ZLS contributors
commit: "b3e65123f1bf455cea491ba7069bebd5f93e6839"
file: src/offsets.zig
lines: [482, 485]
function: tokenIndexLength
difficulty: 1
format: 2
tags: [パース, 文字列処理, 防御的プログラミング]
---

## ひとことで

`tokenIndexLength` は、トークンの番号を受け取って、そのトークンが LSP の単位でどれだけの長さかを返す関数です。ZLS は、トークンの範囲をエディタに伝えるときに、この長さを使います。

## コード

```zig:line-numbers=482
pub fn tokenIndexLength(text: [:0]const u8, index: usize, encoding: Encoding) usize {
    const loc = tokenIndexToLoc(text, index);
    return locLength(text, loc, encoding);
}
```

## 前提知識

- **トークン**: Zig のソースを、意味のある最小単位に分けたものです。キーワード、識別子、記号などがあります。
- **トークンの番号（index）**: 構文解析の結果で、トークンに付けられた通し番号です。
- **`Loc`**: ソース上のバイトの範囲です。`start` と `end` を持ちます。
- **エンコーディング**: LSP では、長さの単位を UTF-8 のバイト数や、UTF-16 の単位数で数えることがあります。`Encoding` で、どの単位で数えるかを指定します。
- **`locLength`**: 範囲の長さを、指定の単位で数える関数です。同じファイルにあります。

## 何をしているか

### 1. トークンの番号を範囲に直す

```zig:line-numbers=483
    const loc = tokenIndexToLoc(text, index);
```

`tokenIndexToLoc` で、トークンの番号を、ソース上の範囲（`Loc`）に変えます。

### 2. 範囲の長さを数える

```zig:line-numbers=484
    return locLength(text, loc, encoding);
```

`locLength` に範囲とエンコーディングを渡して、長さを数えます。結果は、エディタの単位に合った値になります。

## ここがすごい

- **変換の組み合わせ**: 「番号から範囲へ」と「範囲から長さへ」の 2 つの変換を、そのまま連ねています。それぞれの関数が、1 つの仕事だけを担っています。
- **単位を指定できる**: エンコーディングを引数で渡すので、UTF-8 でも UTF-16 でも同じ関数で長さを求められます。
- **複雑さを隠す**: 呼び出し側は、トークンの番号だけを渡せば済みます。範囲の計算は、この関数の中で閉じています。
- **小さく保たれている**: 関数は 2 行だけです。読むのに迷いが少なく、組み合わせのお手本になっています。

## まとめ

- `tokenIndexLength` は、トークンの番号を範囲に直して、その長さを数えます。
- エンコーディングの引数で、長さの単位を選べます。
- 2 つの小さな変換を連ねて、1 つの関数にしています。
