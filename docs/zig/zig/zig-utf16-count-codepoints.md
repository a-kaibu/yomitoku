---
title: UTF-16 の列に含まれる文字（コードポイント）の数を、1 文字ずつ数える
description: Zig 標準ライブラリの unicode.utf16CountCodepoints。UTF-16 の列を反復子で先頭から読み、サロゲートペアは 1 文字として数える。不正な列はエラーになる。
language: zig
project: Zig
repo: https://github.com/ziglang/zig
license: MIT
copyright: Copyright (c) Zig contributors
commit: "738d2be9d6b6ef3ff3559130c05159ef53336224"
file: lib/std/unicode.zig
lines: [513, 518]
function: utf16CountCodepoints
difficulty: 2
format: 2
tags: [Unicode, 文字列処理, 防御的プログラミング]
---

## ひとことで

`utf16CountCodepoints` は、UTF-16 の 16 ビットの単位の列に、何文字（コードポイント）含まれるかを数える関数です。サロゲートペアの 2 単位は、1 文字として数えます。単位の数とは一致しないことがあるので、文字数が必要なときに使います。

## コード

```zig:line-numbers=513
pub fn utf16CountCodepoints(utf16le: []const u16) !usize {
    var len: usize = 0;
    var it = Utf16LeIterator.init(utf16le);
    while (try it.nextCodepoint()) |_| len += 1;
    return len;
}
```

## 前提知識

- **コードユニットとコードポイント**: コードユニットは UTF-16 の 16 ビットの単位、コードポイントは Unicode の文字の番号です。BMP の外の文字は、2 つのユニットで 1 つのコードポイントになります。
- **`Utf16LeIterator`**: UTF-16 の列を、リトルエンディアンでコードポイント単位に読み進める反復子です。
- **`nextCodepoint`**: 次のコードポイントを返す関数です。列の終わりでは `null` を返します。エラーもありえます。
- **`try`**: エラーを、関数の戻り値へそのまま渡す書き方です。
- **`while (...) |_|`**: 値が `null` でない間、ループを回す書き方です。値は使わないので `_` と書きます。

## 何をしているか

### 1. 反復子を用意する

```zig:line-numbers=514
    var len: usize = 0;
    var it = Utf16LeIterator.init(utf16le);
```

数を入れる変数 `len` を 0 にし、UTF-16 の列から反復子を作ります。

### 2. コードポイントを 1 つずつ数える

```zig:line-numbers=516
    while (try it.nextCodepoint()) |_| len += 1;
```

`nextCodepoint` で次の文字を取り出し、取れた間だけ `len` を 1 増やします。サロゲートペアは、反復子の中で 1 文字として読まれるので、2 単位でも 1 と数えます。

### 3. 数を返す

```zig:line-numbers=517
    return len;
```

列の終わりまで数え終わった値を返します。

## ここがすごい

- **反復子に任せる**: 単位の組み立てや、サロゲートペアの判定は、反復子が行います。この関数は数えるだけです。
- **エラーを伝える**: `try` で、壊れた列に当たったら、エラーを呼び出し側へ返します。不正な数を黙って返しません。
- **単位数と分けて扱える**: 同じファイルの `utf16CodeUnitSequenceLength` などは単位の数を求めます。文字の数と単位の数を、目的に応じて選べます。
- **短いループ**: 1 行のループで数えられるのは、反復子の設計が明確だからです。

## まとめ

- `utf16CountCodepoints` は、サロゲートペアを 1 文字として、文字の数を数えます。
- 反復子が単位の組み立てを行い、この関数は数えるだけです。
- 壊れた列はエラーとして返します。
