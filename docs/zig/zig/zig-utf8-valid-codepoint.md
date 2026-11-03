---
title: 文字の番号が、Unicode の有効な範囲にあるかを判定する
description: Zig 標準ライブラリの utf8ValidCodepoint。サロゲートの範囲と、Unicode の最大値を超える範囲を除いて、有効なコードポイントかどうかを true か false で返す。
language: zig
project: Zig
repo: https://github.com/ziglang/zig
license: MIT
copyright: Copyright (c) Zig contributors
commit: "738d2be9d6b6ef3ff3559130c05159ef53336224"
file: lib/std/unicode.zig
lines: [188, 194]
function: utf8ValidCodepoint
difficulty: 1
format: 2
tags: [Unicode, 防御的プログラミング, 型システム]
---

## ひとことで

`utf8ValidCodepoint` は、21 ビットの値が、UTF-8 で書ける文字の番号（コードポイント）として正しいかを判定する関数です。サロゲートの範囲や、Unicode の上限を超える値は、無効とみなします。

## コード

::: code-group

```zig:line-numbers=188 [日本語訳]
pub fn utf8ValidCodepoint(value: u21) bool {
    return switch (value) {
        0xD800...0xDFFF => false, // サロゲートの範囲
        0x110000...0x1FFFFF => false, // Unicode の最大値より上の範囲
        else => true,
    };
}
```

```zig:line-numbers=188 [原文]
pub fn utf8ValidCodepoint(value: u21) bool {
    return switch (value) {
        0xD800...0xDFFF => false, // Surrogates range
        0x110000...0x1FFFFF => false, // Above the maximum codepoint value
        else => true,
    };
}
```

:::

## 前提知識

- **コードポイント**: Unicode の文字に割り当てられた番号です。0 から 0x10FFFF までの値が、文字として定義されています。
- **`u21`**: 21 ビットの符号なし整数です。Unicode の上限を表すのにちょうど足りる大きさです。
- **サロゲート**: UTF-16 で、BMP の外の文字を表すための値の範囲（0xD800 から 0xDFFF）です。文字そのものではないので、UTF-8 の文字としては無効です。
- **範囲の `switch`（`0xD800...0xDFFF`）**: 両端を含む範囲を、値の集まりとして書く書き方です。
- **`else`**: どの範囲にも当てはまらないときの値です。

## 何をしているか

### 1. サロゲートの範囲を除外する

::: code-group

```zig:line-numbers=189 [日本語訳]
    return switch (value) {
        0xD800...0xDFFF => false, // サロゲートの範囲
        0x110000...0x1FFFFF => false, // Unicode の最大値より上の範囲
```

```zig:line-numbers=189 [原文]
    return switch (value) {
        0xD800...0xDFFF => false, // Surrogates range
        0x110000...0x1FFFFF => false, // Above the maximum codepoint value
```

:::

`0xD800...0xDFFF` は、UTF-16 のサロゲートの範囲です。この範囲は UTF-8 の文字にならないので、`false` を返します。

`0x110000...0x1FFFFF` は、Unicode の最大値（0x10FFFF）を超える範囲です。`u21` で表せる値のうち、文字として定義されていない部分です。ここも `false` です。

### 2. それ以外は有効とみなす

```zig:line-numbers=192
        else => true,
    };
```

残りの値は、すべて有効な文字の番号として `true` を返します。

## ここがすごい

- **範囲を表で示す**: 無効な範囲を並べるだけで、どの値が無効かが一目でわかります。
- **型の大きさが上限を決める**: `u21` を使うので、上限より大きな値は型の中に存在しえます。その部分を明示的に除外しているのがポイントです。
- **デコーダの前提を守る**: バイトを UTF-8 から読むとき、この判定で不正なコードポイントを弾けます。
- **短い関数に意味が詰まっている**: 1 つの `switch` で、Unicode の決まりの要点をまとめています。

## まとめ

- `utf8ValidCodepoint` は、サロゲートと Unicode の上限を超える値を無効とします。
- 無効な範囲を `switch` で並べると、判定の意図が読み取りやすくなります。
- `u21` の型が、有効な範囲の上限を表すのに使われています。
