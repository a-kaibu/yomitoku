---
title: 動的なパレットの後始末で、確保したメモリを解放し、値を未定義にする
description: Ghostty の DynamicPalette.deinit。所有している元のパレットのメモリがあれば解放し、構造体の値を undefined にして、誤った再利用を検出しやすくする。
language: zig
project: Ghostty
repo: https://github.com/ghostty-org/ghostty
license: MIT
copyright: Copyright (c) 2024 Mitchell Hashimoto, Ghostty contributors
commit: "a455842c28d587cd2ee2b75cc21fa021b1a47d09"
file: src/terminal/color.zig
lines: [355, 358]
function: DynamicPalette.deinit
difficulty: 2
format: 2
tags: [メモリ管理, 防御的プログラミング, イディオム]
---

## ひとことで

`deinit` は、`DynamicPalette` の使用を終えるときに、確保したメモリを解放する関数です。解放したあとは、値を `undefined` にして、誤って使われないようにします。

## コード

```zig:line-numbers=355
    pub fn deinit(self: *DynamicPalette, alloc: Allocator) void {
        if (self.ownedOriginal()) |owned| alloc.destroy(owned);
        self.* = undefined;
    }
```

## 前提知識

- **`deinit`**: 値の後始末をする関数です。Zig では、確保したメモリを自分で解放します。
- **`ownedOriginal`**: 構造体が所有している、元のパレットへのポインタを返す関数です。所有していなければ `null` です。
- **`alloc.destroy`**: 確保したメモリを解放する関数です。
- **`undefined`**: 値が未定義であることを示す特別な値です。使おうとすると、デバッグのときに検出されることがあります。
- **`self.* = undefined`**: 構造体の全体を未定義にする書き方です。

## 何をしているか

### 1. 所有している場合は解放する

```zig:line-numbers=356
        if (self.ownedOriginal()) |owned| alloc.destroy(owned);
```

`ownedOriginal` で、構造体が確保したパレットがあるかを調べます。あれば、`alloc.destroy` で解放します。組み込みの既定を指している場合は、何もしません。

### 2. 値を未定義にする

```zig:line-numbers=357
        self.* = undefined;
```

`self.* = undefined` で、構造体の値を未定義にします。解放後に誤って使うと、Zig のデバッグのビルドで検出されやすくなります。

## ここがすごい

- **所有の有無で分ける**: 確保していないパレットは解放しないので、二重の解放を防ぎます。
- **未定義で誤用を見つける**: 解放後の値を `undefined` にするので、使い終わった構造体を誤って使うことを検出しやすくなります。
- **`init` と対**: `init` で確保したものを、ここで必ず解放します。
- **所有を明示する**: `ownedOriginal` という名前で、どの値を解放する責任があるかが分かります。

## まとめ

- `deinit` は、所有しているパレットのメモリを解放します。
- 解放後は値を `undefined` にして、誤用を見つけやすくします。
- `init` と対で、確保と解放を揃えます。
