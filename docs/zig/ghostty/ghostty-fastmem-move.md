---
title: libc が使えるなら memmove を直接呼ぶ、速さ優先の移動関数
description: Ghostty の fastmem.move。リンクできる libc があれば C の memmove を呼び、なければ @memmove を使う。同じ意味の移動を、環境に応じて速い方で行う。
language: zig
project: Ghostty
repo: https://github.com/ghostty-org/ghostty
license: MIT
copyright: Copyright (c) 2024 Mitchell Hashimoto, Ghostty contributors
commit: "a455842c28d587cd2ee2b75cc21fa021b1a47d09"
file: src/fastmem.zig
lines: [6, 12]
function: move
difficulty: 2
format: 2
tags: [最適化, 低レイヤ, メモリ管理]
---

## ひとことで

`move` は、スライスの中の要素を、別の位置へ重なっていても安全にコピーする関数です。Ghostty では、端末の画面の行や文字の列を、大量に動かすために使われます。libc が使えるときは、その中の `memmove` を使うので、速く動きます。

## コード

```zig:line-numbers=6
pub inline fn move(comptime T: type, dest: []T, source: []const T) void {
    if (builtin.link_libc) {
        _ = memmove(dest.ptr, source.ptr, source.len * @sizeOf(T));
    } else {
        @memmove(dest, source);
    }
}
```

## 前提知識

- **`memmove`**: C 言語の標準関数で、メモリの領域をコピーします。コピー元とコピー先が重なっていても、正しく動くことが保証されています。
- **libc（C 標準ライブラリ）**: C の言語で書かれた標準ライブラリです。多くの OS では、その中の `memmove` が、CPU に合わせて手で最適化されています。
- **`@memmove`**: Zig の組み込み関数で、libc なしでも同じ意味のコピーを行えます。
- **`builtin.link_libc`**: ビルドで libc がリンクされているかを表す定数です。コンパイル時に決まります。
- **`inline`**: 関数の呼び出しを、呼び出し元に展開する指定です。小さい関数で、呼び出しの負担を減らせます。

## 何をしているか

### 1. libc があれば memmove を呼ぶ

```zig:line-numbers=7
    if (builtin.link_libc) {
        _ = memmove(dest.ptr, source.ptr, source.len * @sizeOf(T));
```

`builtin.link_libc` が真なら、C の `memmove` を呼びます。コピーする量は、要素の数に 1 要素のバイト数を掛けた値です。

### 2. なければ組み込みの移動を使う

```zig:line-numbers=9
    } else {
        @memmove(dest, source);
    }
```

libc がなければ、Zig の `@memmove` を使います。意味は同じで、呼び出し先が違うだけです。

## ここがすごい

- **環境で最速を選ぶ**: `link_libc` は、ビルドの時点で決まるので、実行時の分岐はありません。使える中で速い方を、そのまま選びます。
- **重なりに強い**: コピー元とコピー先が重なっていても、`memmove` は正しく動きます。「行を 1 つずらす」のような操作に、そのまま使えます。
- **`inline` で呼び出しを消す**: 小さい関数を展開するので、呼び出しのための処理が省かれます。
- **コメントの意図が明確**: 関数の注釈には、なぜ libc の版を優先するのか、速さのためだと書かれています。

## まとめ

- `move` は、重なるかもしれない領域を、正しく速くコピーします。
- libc があれば C の `memmove`、なければ Zig の `@memmove` を使います。
- 選択はコンパイル時に決まるので、実行時の負担がありません。
