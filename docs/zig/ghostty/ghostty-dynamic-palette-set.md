---
title: パレットの 1 つの番号に色を設定し、上書きの印を立てる
description: Ghostty の DynamicPalette.set。指定の番号の現在の色を新しい色にし、その番号が上書きされたことを mask に記録する。reset で取り消せる。
language: zig
project: Ghostty
repo: https://github.com/ghostty-org/ghostty
license: MIT
copyright: Copyright (c) 2024 Mitchell Hashimoto, Ghostty contributors
commit: "a455842c28d587cd2ee2b75cc21fa021b1a47d09"
file: src/terminal/color.zig
lines: [361, 364]
function: DynamicPalette.set
difficulty: 1
format: 2
tags: [データ構造, 防御的プログラミング, イディオム]
---

## ひとことで

`set` は、パレットの指定の番号の色を、新しい色に変える関数です。変えた番号は記録されるので、あとで元に戻せます。

## コード

```zig:line-numbers=361
    pub fn set(self: *DynamicPalette, idx: u8, color: RGB) void {
        self.current[idx] = color;
        self.mask.set(idx);
    }
```

## 前提知識

- **パレット**: 端末の色の一覧で、番号で色を指定します。
- **`current` と `original`**: 現在の色と、もとの色の配列です。`set` は `current` だけを変えます。
- **`mask`**: 上書きされた番号を、ビットの集合で記録したものです。
- **`mask.set`**: 指定の番号の印を立てる関数です。
- **`reset`**: 印と色を、もとに戻す関数です。

## 何をしているか

### 1. 現在の色を新しい色にする

```zig:line-numbers=362
        self.current[idx] = color;
```

`self.current[idx]` に、新しい色を入れます。`original` は変えないので、もとの色は残ります。

### 2. 上書きされたことを記録する

```zig:line-numbers=363
        self.mask.set(idx);
```

`mask.set(idx)` で、この番号が上書きされたと記録します。これで、`reset` が戻すべき番号が分かります。

## ここがすごい

- **元の色を残す**: 変えるのは現在の色だけです。`original` は、いつでも戻せる基準として残ります。
- **記録と色を同時に**: 色を変えたら、必ず印も立てるので、印のない変更は起きません。
- **`reset` と対**: 変えた番号を、同じ仕組みで戻せます。
- **`resetAll` で全部戻せる**: 記録があるので、必要な分だけ戻すことも、全部まとめて戻すこともできます。

## まとめ

- `set` は、指定の番号の現在の色を変え、上書きの印を立てます。
- もとの色は `original` に残るので、いつでも戻せます。
- 色と印を同時に更新して、状態を揃えます。
