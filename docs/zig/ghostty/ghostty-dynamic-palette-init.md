---
title: 既定のパレットから、上書きのできる動的なパレットを作る
description: Ghostty の DynamicPalette.init。空の上書き状態を作り、changeDefault で既定のパレットを設定する。既定が組み込みの物なら、メモリを確保しない。
language: zig
project: Ghostty
repo: https://github.com/ghostty-org/ghostty
license: MIT
copyright: Copyright (c) 2024 Mitchell Hashimoto, Ghostty contributors
commit: "a455842c28d587cd2ee2b75cc21fa021b1a47d09"
file: src/terminal/color.zig
lines: [349, 353]
function: DynamicPalette.init
difficulty: 2
format: 2
tags: [データ構造, メモリ管理, イディオム]
---

## ひとことで

`init` は、既定のパレットを受け取って、色を上書きできる `DynamicPalette` を作る関数です。作った後は、必要な番号だけを変えられます。

## コード

```zig:line-numbers=349
    pub fn init(alloc: Allocator, def: Palette) Allocator.Error!DynamicPalette {
        var result: DynamicPalette = .default;
        try result.changeDefault(alloc, def);
        return result;
    }
```

## 前提知識

- **`DynamicPalette`**: 既定のパレットと、上書きの状態を持つ構造体です。
- **`.default`**: 上書きのない初期状態を表す値です。
- **`changeDefault`**: 既定のパレットを変える関数です。上書きした色は保たれます。
- **`Allocator`**: メモリを確保する仕組みです。`try` で、確保の失敗をエラーとして返します。
- **`Allocator.Error!`**: 確保の失敗を表す戻り値の型です。

## 何をしているか

### 1. 上書きのない初期状態を用意する

```zig:line-numbers=350
        var result: DynamicPalette = .default;
```

`.default` で、上書きのない状態の `DynamicPalette` を作ります。

### 2. 既定のパレットを設定して返す

```zig:line-numbers=351
        try result.changeDefault(alloc, def);
        return result;
```

`changeDefault` で、渡された既定のパレットを設定します。必要ならメモリを確保するので、失敗はエラーとして返します。設定が済んだ値を返します。

## ここがすごい

- **既定の値と上書きを分ける**: 作った時点では上書きが空で、既定のパレットがそのまま使われます。
- **組み込みの既定はコピーしない**: 注釈にあるとおり、組み込みの既定のパレットなら、メモリを確保しません。
- **確保の失敗を伝える**: 失敗は `try` で呼び出し側へ返します。
- **`deinit` と対**: 作った値は、`deinit` で後始末します。

## まとめ

- `init` は、既定のパレットから、上書きできる `DynamicPalette` を作ります。
- 初期状態では上書きがなく、既定の色がそのまま使われます。
- 組み込みの既定ならメモリは確保しません。
