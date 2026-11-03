---
title: 上書きがあれば上書きの色を、なければ既定の色を返す
description: Ghostty の DynamicRGB.get。ユーザーが設定で上書きした色（override）があればそれを、なければ既定の色（default）を返す。null の 2 段のフォールバック。
language: zig
project: Ghostty
repo: https://github.com/ghostty-org/ghostty
license: MIT
copyright: Copyright (c) 2024 Mitchell Hashimoto, Ghostty contributors
commit: "a455842c28d587cd2ee2b75cc21fa021b1a47d09"
file: src/terminal/color.zig
lines: [452, 454]
function: DynamicRGB.get
difficulty: 1
format: 2
tags: [イディオム, 防御的プログラミング, 型システム]
---

## ひとことで

`get` は、端末の動的な色（前景色や背景色など）の現在の値を返す関数です。端末のプログラムが色を変えていればその色を、変えていなければ既定の色を返します。

## コード

```zig:line-numbers=452
    pub fn get(self: *const DynamicRGB) ?RGB {
        return self.override orelse self.default;
    }
```

## 前提知識

- **`DynamicRGB`**: 色を 2 つの値で持つ構造体です。`override` は一時的に変えた色、`default` は既定の色です。
- **`?RGB`**: 色があるか、`null` かを表す型です。`null` は、色が決まっていないことを表します。
- **`orelse`**: 左の値が `null` のときだけ、右の値を使う演算子です。
- **`*const DynamicRGB`**: 読むだけのポインタです。値を変えずに読めます。
- **フォールバック**: 第一の候補がなければ、第二の候補を使う仕組みです。

## 何をしているか

### 1. 上書きを優先する

```zig:line-numbers=453
        return self.override orelse self.default;
```

`self.override orelse self.default` で、上書きの色があればそれを返します。上書きが `null` なら、右側の既定の色を返します。

## ここがすごい

- **1 行で優先順位が決まる**: 上書きが優先、既定が次、という規則が、式そのもので表せます。
- **読むだけの関数**: `*const` で受け取るので、色の状態は変わりません。
- **`null` も正しく返る**: 既定の色も未設定なら、`null` が返ります。呼び出し側は、その場合を扱えます。
- **`set` と `reset` と対**: 上書きの設定と解除を、別の関数で行うので、状態の変化が追いやすいです。

## まとめ

- `get` は、上書きの色があればそれを、なければ既定の色を返します。
- `orelse` で、2 段のフォールバックを 1 行で書いています。
- 状態は変えず、読むだけの関数です。
