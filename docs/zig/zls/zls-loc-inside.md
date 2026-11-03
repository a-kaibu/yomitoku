---
title: 小さい範囲が、大きい範囲の中にすっぽり入っているかを判定する
description: ZLS の locInside。内側の範囲の開始が外側以上で、終了が外側以下なら、内側が外側に含まれると判定する。範囲の包含関係を調べる関数。
language: zig
project: ZLS
repo: https://github.com/zigtools/zls
license: MIT
copyright: Copyright (c) ZLS contributors
commit: "b3e65123f1bf455cea491ba7069bebd5f93e6839"
file: src/offsets.zig
lines: [630, 633]
function: locInside
difficulty: 1
format: 2
tags: [アルゴリズム, 防御的プログラミング]
---

## ひとことで

`locInside` は、ある範囲（`inner`）が、別の範囲（`outer`）の中に完全に含まれているかを判定する関数です。ZLS で、カーソルのあるトークンが、特定の式の範囲の中にあるかを調べるときなどに使われます。

## コード

```zig:line-numbers=630
pub fn locInside(inner: Loc, outer: Loc) bool {
    std.debug.assert(inner.start <= inner.end and outer.start <= outer.end);
    return outer.start <= inner.start and inner.end <= outer.end;
}
```

## 前提知識

- **`Loc`**: `start` と `end` を持つ範囲です。`end` は範囲の外の位置です。
- **包含関係**: 内側の範囲が、外側の範囲に全部入っている関係です。端が一致していても、包含とみなします。
- **`std.debug.assert`**: 前提の条件を確かめる関数です。範囲の形が正しいことを、最初に確かめます。
- **論理積（`and`）**: 2 つの条件が両方とも真のときだけ真になります。
- **外側と内側**: 引数の順番に注意が必要です。`inner` が先、`outer` が後の順で渡します。

## 何をしているか

### 1. 前提を確かめる

```zig:line-numbers=631
    std.debug.assert(inner.start <= inner.end and outer.start <= outer.end);
```

両方の範囲の開始が終了以下であることを確かめます。

### 2. 両端が外側に収まるかを比べる

```zig:line-numbers=632
    return outer.start <= inner.start and inner.end <= outer.end;
```

内側の開始が外側の開始以上で、かつ、内側の終了が外側の終了以下なら、内側は外側に含まれます。この 2 つの比較が、包含の条件そのものです。

## ここがすごい

- **条件が 2 つだけ**: 包含は、両端を比べるだけで判定できます。中身の要素を 1 つずつ見る必要がありません。
- **端の一致も包含とみなす**: 内側と外側の端が同じでも包含です。テストの例でも、この境界の扱いが確かめられています。
- **引数の役割が名前で分かる**: `inner` と `outer` と名前を付けているので、どちらがどちらかを読むだけで判別できます。
- **`locIntersect` と対になる**: 重なりを判定する関数と、包含を判定する関数が、同じファイルで並んでいます。

## まとめ

- `locInside` は、内側の範囲の両端が、外側の範囲に収まるかを判定します。
- 端が一致する場合も、包含とみなします。
- 引数の順番は、内側、外側の順で渡すことに注意します。
