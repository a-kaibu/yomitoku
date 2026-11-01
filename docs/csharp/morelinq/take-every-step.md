---
title: "列を一定の間隔で間引き、先頭から数えて n 個ごとに 1 つ取る"
description: "MoreLINQ の TakeEvery。先頭から step 個ごとに 1 つだけ要素を残す。位置の番号を使い、剰余が 0 の位置だけを Where で選ぶ。"
language: csharp
project: "MoreLINQ"
repo: https://github.com/morelinq/MoreLINQ
license: Apache-2.0
copyright: "Copyright (c) 2012 Atif Aziz. All rights reserved."
commit: "d217ab1e8eac68247650c27e977b767dd66bcab0"
file: MoreLinq/TakeEvery.cs
lines: [46, 51]
function: "MoreEnumerable.TakeEvery<TSource>(IEnumerable<TSource>, int)"
difficulty: 1
format: 2
tags: [イテレータ, 遅延評価, アルゴリズム]
---

## ひとことで

`TakeEvery(step)` は、列から **一定の間隔で** 要素を取り出す関数です。
たとえば `0, 1, 2, 3, 4, 5, 6` に `TakeEvery(3)` を使うと、`0, 3, 6` が返ります。先頭から数えて、3 個ごとの位置の要素だけを残します。

間引きや、サンプリング（一部だけを抜き出すこと）に使われます。

## コード

```csharp:line-numbers=46
        public static IEnumerable<TSource> TakeEvery<TSource>(this IEnumerable<TSource> source, int step)
        {
            if (source == null) throw new ArgumentNullException(nameof(source));
            if (step <= 0) throw new ArgumentOutOfRangeException(nameof(step));
            return source.Where((_, i) => i % step == 0);
        }
```

## 前提知識

- **剰余（`%`）**: 割った余りです。`i % step == 0` は、`i` が `step` の倍数であることを表します。
- **位置（インデックス）**: 列の先頭から 0 で始まる番号です。`Where` のラムダ式は、要素と一緒に、この番号を受け取れます。
- **`Where`**: 条件に合う要素だけを残す LINQ の関数です。
- **`_`（捨て変数）**: 使わない引数を表す名前です。ここでは要素の値は使わず、位置だけを見ます。
- **`step`**: 間隔です。1 以下は、間引きの意味がないので、例外にします。

## 何をしているか

### 1. 引数を確かめる

```csharp:line-numbers=48
            if (source == null) throw new ArgumentNullException(nameof(source));
            if (step <= 0) throw new ArgumentOutOfRangeException(nameof(step));
```

列が `null` でないか、間隔が 1 以上かを確かめます。間隔が 0 以下なら、剰余の計算が意味を持たないので、例外を投げます。

### 2. 位置が間隔の倍数なら残す

```csharp:line-numbers=50
            return source.Where((_, i) => i % step == 0);
```

`Where` で、位置 `i` を `step` で割った余りが 0 の要素だけを残します。要素の値そのものは見ないので、どんな型の列にも使えます。

### 具体例で確かめる

`TakeEvery(3)` を、`a, b, c, d, e, f, g`（位置 0〜6）に使います。

```
位置 0 → 0 % 3 = 0 → a を残す
位置 1, 2 → 余りが 0 でない → 捨てる
位置 3 → 0 → d を残す
位置 6 → 0 → g を残す
結果: a, d, g
```

## ここがすごい

- **1 行で書ける**: 位置の剰余で選ぶだけなので、仕組みが非常に単純です。
- **値を見ない**: 要素の型や中身に関係なく、位置だけで間引けます。
- **遅延して返す**: `Where` と同じく、要求されたときに 1 つずつ判定します。
- **間隔の誤りを早く知らせる**: 0 以下の間隔は、最初に例外にするので、剰余の計算で予期しない結果になりません。

## まとめ

- `TakeEvery` は、位置が間隔の倍数の要素だけを残して、一定の間隔で間引く。
- 判定は位置の剰余だけで行い、要素の値は見ない。
- 間隔は 1 以上でなければならず、それ以外は例外になる。
