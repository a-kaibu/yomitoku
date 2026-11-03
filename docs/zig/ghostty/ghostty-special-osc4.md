---
title: 特殊な色の番号に、色の数を足して OSC 4 の番号にする
description: Ghostty の Special.osc4。太字、下線などの特殊な色の番号に、パレットの色の数を足して、OSC 4 の制御で使う番号を返す。xterm の仕様に合わせた変換。
language: zig
project: Ghostty
repo: https://github.com/ghostty-org/ghostty
license: MIT
copyright: Copyright (c) 2024 Mitchell Hashimoto, Ghostty contributors
commit: "a455842c28d587cd2ee2b75cc21fa021b1a47d09"
file: src/terminal/color.zig
lines: [531, 537]
function: Special.osc4
difficulty: 2
format: 2
tags: [イディオム, 型システム, 防御的プログラミング]
---

## ひとことで

`osc4` は、特殊な色（太字、下線、点滅など）を、端末の制御の番号に変換する関数です。通常のパレットの色の番号の後ろに、特殊な色を並べる番号になります。

## コード

::: code-group

```zig:line-numbers=531 [日本語訳]
    pub fn osc4(self: Special) u16 {
        // 「特殊な色は、最大の色数（88 や 256）をこれらの番号に足すと、OSC 4 で設定できる」
        // 最大の色数の例は 88 や 256 である。これらの番号に、OSC 4 の制御として足す。
        // OSC 4 の制御です」 - xterm の ctlseqs
        const max = @typeInfo(Palette).array.len;
        return @as(u16, @intCast(@backingInt(self))) + max;
    }
```

```zig:line-numbers=531 [原文]
    pub fn osc4(self: Special) u16 {
        // "The special colors can also be set by adding the maximum
        // number of colors (e.g., 88 or 256) to these codes in an
        // OSC 4  control" - xterm ctlseqs
        const max = @typeInfo(Palette).array.len;
        return @as(u16, @intCast(@backingInt(self))) + max;
    }
```

:::

## 前提知識

- **OSC 4**: 端末の制御列の 1 つで、パレットの色を設定します。番号を指定して、色を変えられます。
- **パレット**: 端末で使える色の一覧です。通常は 256 色です。
- **`Special`**: 太字、下線、点滅、反転、斜体を表す列挙型です。番号は 0 から始まります。
- **`@typeInfo(Palette).array.len`**: パレットの色の数を、型の情報から取り出す式です。
- **`@backingInt`**: 列挙型の、もとの整数の値を取り出す組み込み関数です。

## 何をしているか

### 1. パレットの色の数を求める

```zig:line-numbers=535
        const max = @typeInfo(Palette).array.len;
```

`Palette` の配列の長さを、型の情報から取り出します。256 色なら、256 です。

### 2. 特殊な色の番号に足す

```zig:line-numbers=536
        return @as(u16, @intCast(@backingInt(self))) + max;
```

特殊な色の番号を `u16` に広げ、パレットの色の数を足します。たとえば太字（番号 0）は 256、下線（番号 1）は 257 になります。

## ここがすごい

- **数値の決まりを型から導く**: パレットの色の数を手で書かず、型から取り出しています。パレットの大きさを変えても、自動で合います。
- **仕様の根拠をコメントに**: 注釈は、xterm の制御列の仕様から来ていることを示しています。
- **テストが番号を確かめる**: ファイルの `test` は、太字が 256、下線が 257 などの値を、順に確かめています。
- **型の広げ方**: `@intCast` で `u16` に変えてから足すので、番号が溢れません。

## まとめ

- `osc4` は、特殊な色の番号に、パレットの色の数を足します。
- 色の数は型の情報から取るので、パレットの大きさの変更に追従します。
- 番号の根拠は、xterm の制御列の仕様です。
