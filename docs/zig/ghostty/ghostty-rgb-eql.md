---
title: 2 つの色の赤・緑・青がすべて同じかを比べる
description: Ghostty の RGB.eql。赤、緑、青の 3 つの成分がすべて一致したときだけ true を返す。色の同一性の判定に使う、基本の比較関数。
language: zig
project: Ghostty
repo: https://github.com/ghostty-org/ghostty
license: MIT
copyright: Copyright (c) 2024 Mitchell Hashimoto, Ghostty contributors
commit: "a455842c28d587cd2ee2b75cc21fa021b1a47d09"
file: src/terminal/color.zig
lines: [620, 622]
function: RGB.eql
difficulty: 1
format: 2
tags: [イディオム, 防御的プログラミング, 型システム]
---

## ひとことで

`eql` は、2 つの色が同じ色かどうかを判定する関数です。赤、緑、青の 3 つの成分がすべて同じ値のときだけ、`true` を返します。

## コード

```zig:line-numbers=620
    pub fn eql(self: RGB, other: RGB) bool {
        return self.r == other.r and self.g == other.g and self.b == other.b;
    }
```

## 前提知識

- **色の成分**: `RGB` 型は、赤（`r`）、緑（`g`）、青（`b`）の 3 つの値を持つ構造体です。各値は 0 から 255 です。
- **論理積（`and`）**: すべての条件が真のときだけ真になる演算子です。
- **`==`**: 値が等しいかを比べる演算子です。
- **`eql` という名前**: 「equal（等しい）」を省略した名前で、Zig の標準ライブラリでも、同じ意味の名前が使われます。
- **`other: RGB`**: 比べる相手の色です。

## 何をしているか

### 1. 3 つの成分をすべて比べる

```zig:line-numbers=621
        return self.r == other.r and self.g == other.g and self.b == other.b;
```

`self.r == other.r`、`self.g == other.g`、`self.b == other.b` の 3 つを `and` で結びます。3 つとも一致したときだけ真になります。途中で 1 つでも違えば、残りを比べずに偽になります。

## ここがすごい

- **全部一致のときだけ真**: 3 つの成分を `and` で結ぶことで、色の同一性が正しく判定できます。
- **短絡評価**: `and` は、前が偽なら後ろを評価しません。違いがあればすぐ止まります。
- **構造体の比較を書き下す**: Zig では、構造体同士を `==` で直接比べられないので、成分を 1 つずつ比べます。
- **用途が明快**: 色を比べる処理が、この関数を呼ぶだけになります。

## まとめ

- `eql` は、赤、緑、青の 3 つがすべて一致するかを判定します。
- `and` で結ぶので、違いが見つかった時点で偽になります。
- 構造体の値を比べるときの、基本の書き方です。
