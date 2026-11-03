---
title: 重ならない領域のコピーを、libc の memcpy で速く行う
description: Ghostty の fastmem.copy。コピー元とコピー先が重ならないと分かっているときに使う。libc があれば memcpy を呼び、なければ @memcpy に任せる。
language: zig
project: Ghostty
repo: https://github.com/ghostty-org/ghostty
license: MIT
copyright: Copyright (c) 2024 Mitchell Hashimoto, Ghostty contributors
commit: "a455842c28d587cd2ee2b75cc21fa021b1a47d09"
file: src/fastmem.zig
lines: [16, 22]
function: copy
difficulty: 1
format: 2
tags: [最適化, 低レイヤ, メモリ管理]
---

## ひとことで

`copy` は、スライスの要素を別のスライスへコピーする関数です。`move` と違い、コピー元とコピー先が重ならないことを前提にしています。その分、libc の `memcpy` が使えるなら、より速く動きます。

## コード

```zig:line-numbers=16
pub inline fn copy(comptime T: type, dest: []T, source: []const T) void {
    if (builtin.link_libc) {
        _ = memcpy(dest.ptr, source.ptr, source.len * @sizeOf(T));
    } else {
        @memcpy(dest[0..source.len], source);
    }
}
```

## 前提知識

- **`memcpy`**: C 言語の標準関数で、メモリの領域を別の領域へコピーします。2 つの領域が重なるとき、動作は保証されません。
- **`memmove` との違い**: `memmove` は重なりに対応していますが、その分わずかに手間がかかります。重ならないと分かっているなら、`memcpy` の方が速くなることがあります。
- **`@memcpy`**: Zig の組み込み関数で、libc がなくても同じ意味のコピーを行えます。
- **`builtin.link_libc`**: libc がリンクされているかを表す、コンパイル時の定数です。
- **`dest[0..source.len]`**: コピー先の先頭から、コピー元と同じ長さの部分だけを切り出す書き方です。

## 何をしているか

### 1. libc があれば memcpy を呼ぶ

```zig:line-numbers=17
    if (builtin.link_libc) {
        _ = memcpy(dest.ptr, source.ptr, source.len * @sizeOf(T));
```

`builtin.link_libc` が真なら、C の `memcpy` を呼びます。コピーするバイト数は、要素の数に 1 要素の大きさを掛けたものです。

### 2. なければ組み込みのコピーを使う

```zig:line-numbers=19
    } else {
        @memcpy(dest[0..source.len], source);
    }
```

libc がないときは、`@memcpy` を使います。コピー先を、コピー元の長さに切り詰めてから渡しています。

## ここがすごい

- **重なりがないという前提を明示**: 関数の名前と、`move` との対比で、使い分けの前提がはっきりしています。
- **速い方を選ぶ**: `memcpy` は、CPU に合わせて最適化された実装が多く、大きなコピーで効きます。
- **環境の差を吸収する**: 呼び出し側は、libc の有無を気にせず、同じ `copy` を使えます。
- **`move` と組にある**: 同じファイルの `move` は、重なりに対応する版です。使う場面に応じて選べます。

## まとめ

- `copy` は、重ならないスライスどうしを速くコピーします。
- libc があれば `memcpy`、なければ `@memcpy` を使います。
- 重なるかもしれない場合は、`move` を使います。
