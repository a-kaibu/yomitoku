---
title: 8 バイトまとめて ASCII かどうかを見て、文字数を数える
description: UTF-8 の文字列に含まれる文字数（コードポイント数）を数える utf8CountCodepoints。ASCII の並びは 8 バイトずつ一気に数え、速さを稼いでいる。
language: zig
project: Zig
repo: https://github.com/ziglang/zig
license: MIT
copyright: Copyright (c) Zig contributors
commit: "738d2be9d6b6ef3ff3559130c05159ef53336224"
file: lib/std/unicode.zig
lines: [198, 228]
function: utf8CountCodepoints
difficulty: 3
format: 2
tags: [Unicode, 文字列処理, 最適化]
---

## ひとことで

`utf8CountCodepoints` は、UTF-8 の文字列の中に、Unicode の文字（コードポイント）が何個あるかを数える関数です。
たとえば `"あいう"` は 9 バイトですが、文字数は `3` です。文字列の長さ（バイト数）と文字数は、UTF-8 では一致しないことがあります。

この関数は、英数字（ASCII）が続く部分を **8 バイトずつまとめて** 確かめて、速く数えます。

## コード

::: code-group

```zig:line-numbers=198 [日本語訳]
pub fn utf8CountCodepoints(s: []const u8) !usize {
    var len: usize = 0;

    const N = @sizeOf(usize);
    const MASK = 0x80 * (std.math.maxInt(usize) / 0xff);

    var i: usize = 0;
    while (i < s.len) {
        // ASCII の並びを処理する近道
        while (i + N <= s.len) : (i += N) {
            const v = mem.readInt(usize, s[i..][0..N], native_endian);
            if (v & MASK != 0) break;
            len += N;
        }

        if (i < s.len) {
            const n = try utf8ByteSequenceLength(s[i]);
            if (i + n > s.len) return error.TruncatedInput;

            switch (n) {
                1 => {}, // ASCII なので検証は不要
                else => _ = try utf8Decode(s[i..][0..n]),
            }

            i += n;
            len += 1;
        }
    }

    return len;
}
```

```zig:line-numbers=198 [原文]
pub fn utf8CountCodepoints(s: []const u8) !usize {
    var len: usize = 0;

    const N = @sizeOf(usize);
    const MASK = 0x80 * (std.math.maxInt(usize) / 0xff);

    var i: usize = 0;
    while (i < s.len) {
        // Fast path for ASCII sequences
        while (i + N <= s.len) : (i += N) {
            const v = mem.readInt(usize, s[i..][0..N], native_endian);
            if (v & MASK != 0) break;
            len += N;
        }

        if (i < s.len) {
            const n = try utf8ByteSequenceLength(s[i]);
            if (i + n > s.len) return error.TruncatedInput;

            switch (n) {
                1 => {}, // ASCII, no validation needed
                else => _ = try utf8Decode(s[i..][0..n]),
            }

            i += n;
            len += 1;
        }
    }

    return len;
}
```

:::

## 前提知識

- **コードポイント**: Unicode の 1 文字に割り当てられた番号です。UTF-8 では、1 文字が 1 から 4 バイトで表されます。
- **ASCII**: 英数字や記号など、バイトの値が 0 から 127 までの文字です。UTF-8 では 1 バイトで表され、最上位のビット（0x80）が 0 です。
- **`[]const u8`**: バイトの列（スライス）です。`s.len` はバイト数です。
- **`usize`**: CPU の 1 語の大きさの整数です。64 ビットの CPU なら 8 バイトになります。
- **`mem.readInt`**: バイト列を指定の型の整数として読みます。`native_endian` は、この CPU の並び順です。
- **`try`**: エラーが返ったら、そのまま関数からエラーを返す書き方です。
- **`switch` の `1 => {}`**: 何もしない場合を書く書き方です。

## 何をしているか

### 1. 最上位ビットを見るマスクを作る

```zig:line-numbers=201
    const N = @sizeOf(usize);
    const MASK = 0x80 * (std.math.maxInt(usize) / 0xff);
```

`N` は、`usize` のバイト数です。64 ビットの CPU では `8` です。

`MASK` は、各バイトの最上位ビット（0x80）だけを立てた値です。`0xff` で割った `maxInt` は、`0x0101010101010101` のように各バイトが 1 の値になり、それに `0x80` を掛けると各バイトの最上位ビットだけが立ちます。このマスクを使うと、8 バイトのうちに 1 つでも非 ASCII のバイトがあるかを、1 回の AND で調べられます。

### 2. ASCII の並びを 8 バイトずつ数える

```zig:line-numbers=206
        // Fast path for ASCII sequences
        while (i + N <= s.len) : (i += N) {
            const v = mem.readInt(usize, s[i..][0..N], native_endian);
            if (v & MASK != 0) break;
            len += N;
        }
```

`v` は、今の位置から 8 バイトを読んだ値です。`v & MASK` が 0 でなければ、どこかに最上位ビットが立ったバイト、つまり非 ASCII のバイトがあります。そのときは `break` して、1 バイトずつの処理に切り替えます。0 なら、8 バイトすべてが ASCII なので、`len` に 8 を足して次へ進みます。

たとえば `"abcdefgh"` の 8 バイトは、1 回の判定で 8 文字として数え終わります。

### 3. 1 文字ずつ、長さを確かめて進む

```zig:line-numbers=213
        if (i < s.len) {
            const n = try utf8ByteSequenceLength(s[i]);
            if (i + n > s.len) return error.TruncatedInput;
```

非 ASCII の文字は、先頭バイトから何バイトの文字か（`n`）を決めます。文字列の終わりで途中切れになっていれば、`TruncatedInput` のエラーを返します。

### 4. 文字の正しさを確かめて数える

```zig:line-numbers=217
            switch (n) {
                1 => {}, // ASCII, no validation needed
                else => _ = try utf8Decode(s[i..][0..n]),
            }

            i += n;
            len += 1;
```

1 バイトの文字（ASCII）は、検証なしで受け入れます。2 バイト以上の文字は、`utf8Decode` で中身が正しい UTF-8 かを確かめます。不正なバイト列なら、ここでエラーになります。

正しいと分かったら、文字の長さ `n` 分だけ位置を進め、文字数を 1 増やします。

## ここがすごい

- **8 バイトずつの比較**: 英語の文章は ASCII が多いので、ほとんどの部分が 8 バイト単位で一気に終わります。1 バイトずつ調べるより、ループの回数がずっと減ります。
- **マスクで判定を 1 回に**: 8 バイトのどこかに非 ASCII があるかを、1 回の AND で調べられます。判定に分岐が多くならないので、CPU のパイプラインも乱れにくくなります。
- **ASCII は検証を省く**: 1 バイトの文字は、UTF-8 として必ず正しいので、`switch` の `1 => {}` で検証を省略しています。
- **不正な入力をエラーにする**: 途切れた文字や、壊れた多バイト文字は、数える途中でエラーになります。間違った文字数を黙って返さないようにしています。

## まとめ

- UTF-8 の文字数は、バイト数とは違うので、先頭バイトを見て 1 文字ずつ進む必要があります。
- 英数字が続く部分は、8 バイトずつのマスク判定で一気に数えると速くなります。
- 非 ASCII の文字だけ、長さと中身を確かめて、1 文字ずつ数えます。
- 速さのための近道を入れても、途切れた文字や壊れた文字はエラーとして扱います。
