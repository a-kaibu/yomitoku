---
title: 2 つの範囲が 1 文字でも重なるかを、端どうしの比較 2 つで判定する
description: ZLS の locIntersect。ソースコード上の 2 つの範囲 Loc が重なるかを、開始と終了を比べる 2 つの不等式で判定する。端が接しているだけの場合は重ならない扱い。
language: zig
project: ZLS
repo: https://github.com/zigtools/zls
license: MIT
copyright: Copyright (c) ZLS contributors
commit: "b3e65123f1bf455cea491ba7069bebd5f93e6839"
file: src/offsets.zig
lines: [614, 617]
function: locIntersect
difficulty: 1
format: 2
tags: [アルゴリズム, 防御的プログラミング, パース]
---

## ひとことで

`locIntersect` は、ソースコード上の 2 つの範囲（`Loc`）が重なっているかを判定する関数です。ZLS（Zig の言語サーバー）が、カーソルの位置や変更された範囲が、どの要素に関係するかを調べるときに使われます。

## コード

```zig:line-numbers=614
pub fn locIntersect(a: Loc, b: Loc) bool {
    std.debug.assert(a.start <= a.end and b.start <= b.end);
    return a.start < b.end and a.end > b.start;
}
```

## 前提知識

- **`Loc`**: `start` と `end` の 2 つのバイト位置で、ソースコード上の範囲を表す構造体です。`end` は範囲に含まれない位置です。
- **半開区間**: `[start, end)` の形で、`start` は含み、`end` は含まない範囲の表し方です。範囲どうしがぴったり接するときは、重ならない扱いになります。
- **`std.debug.assert`**: 前提の条件を確かめる関数です。ここでは `start` が `end` 以下であることを確かめます。
- **`and`**: 両方の条件が真のときだけ真になる論理演算子です。
- **重なりの考え方**: 2 つの範囲が重なるのは、一方の開始が他方の終了より前で、かつ一方の終了が他方の開始より後のときです。

## 何をしているか

### 1. 前提を確かめる

```zig:line-numbers=615
    std.debug.assert(a.start <= a.end and b.start <= b.end);
```

両方の範囲について、開始が終了以下であることを `assert` で確かめます。逆になっていれば、呼び出し側の誤りとして止まります。

### 2. 端どうしを比べる

```zig:line-numbers=616
    return a.start < b.end and a.end > b.start;
```

`a.start < b.end` と `a.end > b.start` の両方が真なら、2 つの範囲は重なっています。どちらか一方でも偽なら、範囲は離れているか、端だけが接しています。

## ここがすごい

- **比べるのは 2 組だけ**: 範囲の重なりは、4 つの端の比較の中で必要なのは 2 つだけです。計算がとても軽くなっています。
- **接する場合の扱いを明確に**: `a.end` と `b.start` が等しいとき、重ならないと判定します。半開区間の考え方と一致しています。
- **テストが境界を網羅**: ファイルの `test` は、接する場合と重なる場合を両方並べています。境界の扱いが、例で確かめられます。
- **前提が書いてある**: `assert` で、範囲の形（開始が終了以下）を守らせています。

## まとめ

- `locIntersect` は、2 つの範囲の端どうしを 2 回比べて、重なりを判定します。
- 半開区間の考え方で、接するだけの範囲は重ならないとみなします。
- `assert` で範囲の形を前提にし、誤った値を早く検出します。
