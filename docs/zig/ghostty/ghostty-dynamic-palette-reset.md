---
title: 1 つの色の上書きを取り消して、もとの色に戻す
description: Ghostty の DynamicPalette.reset。指定の番号の色を、元の値に戻し、上書きの印（mask）を消す。上書きされたかどうかの記録も一緒に更新する。
language: zig
project: Ghostty
repo: https://github.com/ghostty-org/ghostty
license: MIT
copyright: Copyright (c) 2024 Mitchell Hashimoto, Ghostty contributors
commit: "a455842c28d587cd2ee2b75cc21fa021b1a47d09"
file: src/terminal/color.zig
lines: [367, 370]
function: DynamicPalette.reset
difficulty: 2
format: 2
tags: [データ構造, 防御的プログラミング, イディオム]
---

## ひとことで

`reset` は、パレットの指定の番号の色を、もとの値に戻す関数です。端末のプログラムが色を変えたあとに、元に戻すときに使われます。

## コード

```zig:line-numbers=367
    pub fn reset(self: *DynamicPalette, idx: u8) void {
        self.current[idx] = self.original[idx];
        self.mask.unset(idx);
    }
```

## 前提知識

- **パレット**: 端末の色の一覧です。番号で色を指定します。
- **`current` と `original`**: 現在の色と、もとの色の 2 つの配列です。`reset` は、現在の色をもとの色で上書きします。
- **`mask`**: どの番号の色が上書きされたかを、ビットの集合で記録したものです。
- **`mask.unset`**: 指定の番号の印を消す関数です。
- **`DynamicPalette`**: 上書きを記録しながら、パレットを変えられる構造体です。

## 何をしているか

### 1. 色をもとの値に戻す

```zig:line-numbers=368
        self.current[idx] = self.original[idx];
```

`self.current[idx]` に `self.original[idx]` を入れて、色をもとに戻します。

### 2. 上書きの印を消す

```zig:line-numbers=369
        self.mask.unset(idx);
```

`mask.unset(idx)` で、この番号の色は上書きされていない、と記録します。

## ここがすごい

- **色と記録を同時に更新**: 色を戻すと同時に、印も消します。両方がずれないように、続けて書かれています。
- **`set` と対**: 同じ構造体の `set` は、色を変えて印を立てます。対にすると、状態の変化が追いやすいです。
- **もとの値を別に持つ**: `original` があるので、いつでも元の色を取り出せます。
- **全体の初期化とは分けている**: 1 つだけ戻す `reset` と、全部戻す `resetAll` が分かれています。

## まとめ

- `reset` は、指定の番号の色をもとの値に戻し、上書きの印を消します。
- 色と印の 2 つを、同じ関数で揃えて更新します。
- 全体を戻す `resetAll` と使い分けます。
