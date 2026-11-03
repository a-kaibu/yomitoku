---
title: 行と文字の位置が、範囲の中にあるかを 2 回の順序比べで判定する
description: ZLS の positionInsideRange。LSP の行と文字の位置 Position が、Range の開始と終了の間にあるかを、orderPosition の 2 回の比べで判定する。
language: zig
project: ZLS
repo: https://github.com/zigtools/zls
license: MIT
copyright: Copyright (c) ZLS contributors
commit: "b3e65123f1bf455cea491ba7069bebd5f93e6839"
file: src/offsets.zig
lines: [664, 667]
function: positionInsideRange
difficulty: 2
format: 2
tags: [アルゴリズム, 防御的プログラミング, パース]
---

## ひとことで

`positionInsideRange` は、エディタの位置（行と文字の番号）が、ある範囲の中にあるかを判定する関数です。言語サーバーのプロトコル（LSP）では、位置と範囲を「行」と「文字」の組で表します。その比べ方を、順序の関数で行っています。

## コード

```zig:line-numbers=664
pub fn positionInsideRange(inner: Position, outer: Range) bool {
    std.debug.assert(orderPosition(outer.start, outer.end) != .gt);
    return orderPosition(outer.start, inner) != .gt and orderPosition(inner, outer.end) != .gt;
}
```

## 前提知識

- **LSP（Language Server Protocol）**: エディタと言語サーバーの間で、位置や範囲をやりとりする決まりです。
- **`Position`**: 行（`line`）と文字（`character`）の組です。行が先、文字が後の順で比べます。
- **`Range`**: 開始の `Position` と、終了の `Position` の組です。
- **`orderPosition`**: 2 つの `Position` の大小を比べて、`lt`、`eq`、`gt` のどれかを返す関数です。
- **`std.math.Order`**: 比較の結果を表す列挙型です。`.gt` は左が右より大きいことを表します。

## 何をしているか

### 1. 範囲の順序を確かめる

```zig:line-numbers=665
    std.debug.assert(orderPosition(outer.start, outer.end) != .gt);
```

範囲の開始が終了より後ろになっていないことを、`assert` で確かめます。

### 2. 開始以上、終了以下かを比べる

```zig:line-numbers=666
    return orderPosition(outer.start, inner) != .gt and orderPosition(inner, outer.end) != .gt;
```

`orderPosition(outer.start, inner) != .gt` で、位置が開始以上であることを確かめます。`orderPosition(inner, outer.end) != .gt` で、位置が終了以下であることを確かめます。両方が真なら、範囲の中にあります。

## ここがすごい

- **行と文字の比べ方を 1 か所に**: 2 つの位置の大小を、`orderPosition` が一手に引き受けています。行の番号が同じ場合の文字の比べ方も、その関数の中で決まります。
- **`!= .gt` の書き方**: 「大きくない」と書くことで、等しい場合を含めた判定になります。端の位置が範囲に含まれることが、この 1 行で表せます。
- **前提を守る**: 範囲の順序を `assert` で確かめているので、逆順の範囲で誤った結果が出ることを防ぎます。
- **テストが境界を示す**: ファイルの `test` は、行の前後、同じ行の前後、範囲の端などの例を並べています。

## まとめ

- `positionInsideRange` は、位置が範囲の開始以上、終了以下かを判定します。
- 位置の大小は `orderPosition` に任せ、この関数は 2 回の比べ方だけを書きます。
- 端の位置は範囲に含まれるとみなします。
