---
title: 上書きした色を取り消して、既定の色に戻す
description: Ghostty の DynamicRGB.reset。上書きの色（override）を null に戻す。既定の色はそのまま残るので、get は既定の色を返すようになる。
language: zig
project: Ghostty
repo: https://github.com/ghostty-org/ghostty
license: MIT
copyright: Copyright (c) 2024 Mitchell Hashimoto, Ghostty contributors
commit: "a455842c28d587cd2ee2b75cc21fa021b1a47d09"
file: src/terminal/color.zig
lines: [460, 462]
function: DynamicRGB.reset
difficulty: 1
format: 2
tags: [イディオム, データ構造, 防御的プログラミング]
---

## ひとことで

`reset` は、端末の動的な色の上書きを取り消す関数です。上書きを `null` に戻すと、以後は既定の色が使われます。

## コード

```zig:line-numbers=460
    pub fn reset(self: *DynamicRGB) void {
        self.override = null;
    }
```

## 前提知識

- **`DynamicRGB`**: 上書きの色と、既定の色を持つ構造体です。
- **`override`**: 一時的に設定された色です。`null` なら上書きはありません。
- **`default`**: 既定の色です。`reset` では変えません。
- **`set` との対**: 同じ構造体の `set` は、上書きの色を設定します。
- **`get`**: 上書きがなければ既定の色を返す関数です。

## 何をしているか

### 1. 上書きを null に戻す

```zig:line-numbers=461
        self.override = null;
```

`self.override = null` で、上書きの色を取り除きます。既定の色は、そのまま残ります。

## ここがすごい

- **既定の値を壊さない**: 上書きだけを消すので、もとの色に戻すのに、既定の値を別に保存しておく必要がありません。
- **状態が 1 つだけ変わる**: 関数は 1 行で、変わる場所が `override` だけだと分かります。
- **`get` と組で読める**: `reset` のあと `get` は既定の色を返す、という流れが、2 つの関数で完結します。
- **副作用が明確**: 戻り値がなく、状態の変更だけを行うと、名前からも分かります。

## まとめ

- `reset` は、上書きの色を `null` に戻します。
- 既定の色は変わらず、`get` が既定の色を返すようになります。
- `set` と対で、上書きの設定と解除を行います。
