---
title: Zig の RGB 型を、C の構造体の形に詰め替える
description: Ghostty の RGB.cval。Zig の RGB の赤、緑、青の値を、C の API が受け取る構造体の型に詰め替える。fromC と逆向きの変換。
language: zig
project: Ghostty
repo: https://github.com/ghostty-org/ghostty
license: MIT
copyright: Copyright (c) 2024 Mitchell Hashimoto, Ghostty contributors
commit: "a455842c28d587cd2ee2b75cc21fa021b1a47d09"
file: src/terminal/color.zig
lines: [612, 618]
function: RGB.cval
difficulty: 1
format: 2
tags: [イディオム, 型システム, 標準ライブラリ]
---

## ひとことで

`cval` は、Zig の `RGB` 型の値を、C の言語の構造体の形に変える関数です。C のライブラリに色を渡すときに使われます。同じファイルの `fromC` の逆の変換です。

## コード

```zig:line-numbers=612
    pub fn cval(self: RGB) C {
        return .{
            .r = self.r,
            .g = self.g,
            .b = self.b,
        };
    }
```

## 前提知識

- **C の構造体**: C 言語の `struct` で、Zig から C のライブラリを呼ぶときに、この形の値を渡します。
- **`C` 型**: `RGB` の中で定義された、C の側の構造体の型です。
- **`fromC`**: 逆方向の変換です。C の構造体から `RGB` を作ります。
- **構造体のリテラル（`.{ .r = ..., .g = ..., .b = ... }`）**: 名前付きの値を並べて、構造体を作る書き方です。
- **型の推論**: 戻り値の型が `C` なので、`.{ ... }` の型は自動で決まります。

## 何をしているか

### 1. 3 つの成分を C の構造体に詰める

```zig:line-numbers=613
        return .{
            .r = self.r,
            .g = self.g,
            .b = self.b,
        };
```

`self.r`、`self.g`、`self.b` の値を、C の構造体の同じ名前のフィールドに入れます。成分の値は、変わらずに渡ります。

## ここがすごい

- **変換の規則が 1 か所に**: C と Zig の色の型の対応が、この 2 つの関数（`fromC` と `cval`）にまとまっています。
- **往復が安全**: `cval` で C の形にして `fromC` で戻すと、もとの値が得られます。
- **型の境界が明確**: C の型は、この関数の戻り値に限られます。内部の処理は Zig の `RGB` で行えます。
- **名前が短く分かりやすい**: `cval` は、C の値（C value）を作る関数だと分かります。

## まとめ

- `cval` は、Zig の `RGB` を C の構造体の形に詰め替えます。
- 逆の `fromC` と組で、往復の変換ができます。
- 色を C の API に渡す境界で使われます。
