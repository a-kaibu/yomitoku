---
title: 上書きした色をすべて取り消して、パレットを元の状態に戻す
description: Ghostty の DynamicPalette.resetAll。現在の色の配列を、もとの配列の内容で丸ごと上書きし、上書きの印もすべて空にする。
language: zig
project: Ghostty
repo: https://github.com/ghostty-org/ghostty
license: MIT
copyright: Copyright (c) 2024 Mitchell Hashimoto, Ghostty contributors
commit: "a455842c28d587cd2ee2b75cc21fa021b1a47d09"
file: src/terminal/color.zig
lines: [373, 376]
function: DynamicPalette.resetAll
difficulty: 1
format: 2
tags: [データ構造, 防御的プログラミング, イディオム]
---

## ひとことで

`resetAll` は、端末のパレットの全部の色を、もとの値に戻す関数です。プログラムが色をたくさん変えたあと、まとめて元に戻すときに使われます。

## コード

```zig:line-numbers=373
    pub fn resetAll(self: *DynamicPalette) void {
        self.current = self.original.*;
        self.mask = .empty;
    }
```

## 前提知識

- **`current` と `original`**: 現在の色の配列と、もとの色の配列です。どちらも同じ大きさです。
- **`mask`**: どの番号の色が上書きされたかを記録する、ビットの集合です。
- **`.empty`**: 空の集合を表す値です。
- **配列の代入**: `self.current = self.original.*` で、配列の中身を丸ごと代入します。
- **`reset` との違い**: `reset` は 1 つの色だけ戻します。この関数は、全部をまとめて戻します。

## 何をしているか

### 1. 色の配列をもとの内容で置き換える

```zig:line-numbers=374
        self.current = self.original.*;
```

`original.*` の配列を、そのまま `current` に代入します。1 つずつ戻す必要がありません。

### 2. 上書きの印を空にする

```zig:line-numbers=375
        self.mask = .empty;
```

`mask` を空の集合にして、どの色も上書きされていない状態にします。

## ここがすごい

- **まとめて戻せる**: 配列の代入 1 行で、全部の色が元に戻ります。
- **印と色が揃う**: 色を戻すのと同時に、印も空にするので、状態が矛盾しません。
- **`reset` と対**: 1 つだけの取り消しと、全体の取り消しを、2 つの関数で使い分けます。
- **短い実装**: 2 行で、パレット全体の初期化が書けます。

## まとめ

- `resetAll` は、現在の色をもとの配列で丸ごと置き換え、上書きの印を空にします。
- 1 つずつ戻す `reset` と使い分けます。
- 色と印を同時に揃えるので、状態が矛盾しません。
