---
title: "同じ値が 2 回目に現れた瞬間に、その値を 1 回だけ返す"
description: "MoreLINQ の Duplicates。要素ごとの出現回数を数え、ちょうど 2 回目に出会ったときだけ返す。3 回目以降は回数を 3 で頭打ちにして、二度と返さない。"
language: csharp
project: "MoreLINQ"
repo: https://github.com/morelinq/MoreLINQ
license: Apache-2.0
copyright: "Copyright (c) 2012 Atif Aziz. All rights reserved."
commit: "d217ab1e8eac68247650c27e977b767dd66bcab0"
file: MoreLinq/Duplicates.cs
lines: [52, 62]
function: "MoreEnumerable.Duplicates<TSource>(IEnumerable<TSource>, IEqualityComparer<TSource>?)"
difficulty: 3
format: 2
tags: [データ構造, ハッシュ, 遅延評価]
---

## ひとことで

`Duplicates` は、列の中で **重複している値** を返す関数です。
同じ値が 2 回目に出てきた時点で、その値を 1 回だけ返します。たとえば `1, 2, 1, 3, 2, 2` からは、`1`（3 番目の要素で）と `2`（5 番目の要素で）が返ります。

3 回目以降に同じ値が出てきても、もう返しません。

## コード

```csharp:line-numbers=52
        public static IEnumerable<TSource> Duplicates<TSource>(this IEnumerable<TSource> source, IEqualityComparer<TSource>? comparer)
        {
            if (source is null) throw new ArgumentNullException(nameof(source));

            return from e in source.ScanBy(static e => e,
                                           static _ => 0,
                                           static (count, _, _) => unchecked(Math.Min(count + 1, 3)),
                                           comparer)
                   where e.Value is 2
                   select e.Key;
        }
```

## 前提知識

- **出現回数**: ある値が列の中に何回現れたかを表す数です。
- **`ScanBy`**: キーごとに状態（ここでは出現回数）を持ちながら、要素を順に処理する仕組みです。同じキーの要素ごとに、前の状態を引き継ぎます。
- **`IEqualityComparer<TSource>`**: 2 つの値が「同じ」かどうかを決める比較の道具です。`null` のときは既定の比べ方を使います。
- **`Math.Min`**: 2 つの値の小さい方を返します。ここでは、回数を 3 で止めるために使います。
- **`unchecked`**: 整数の計算でオーバーフローが起きても例外にせず、そのまま計算する指定です。

## 何をしているか

### 1. 要素ごとに回数を数える

```csharp:line-numbers=56
            return from e in source.ScanBy(static e => e,
                                           static _ => 0,
                                           static (count, _, _) => unchecked(Math.Min(count + 1, 3)),
                                           comparer)
```

`ScanBy` で、要素のキーごとに出現回数を数えます。回数は `count + 1` で増やしますが、`Math.Min(..., 3)` で 3 を超えないようにしています。

### 2. ちょうど 2 回目だけを選ぶ

```csharp:line-numbers=60
                   where e.Value is 2
                   select e.Key;
```

`where e.Value is 2` で、回数がちょうど 2 になった要素だけを選び、その元の値（`e.Key`）を返します。

### 具体例で確かめる

`1, 2, 1, 3, 2, 2` を順に数えると、次のようになります。

```
1: 回数 1 → 返さない
2: 回数 1 → 返さない
1: 回数 2 → 返す（1）
3: 回数 1 → 返さない
2: 回数 2 → 返す（2）
2: 回数 3 → 返さない（3 は 2 と違うため）
```

## ここがすごい

- **1 回の走査で済む**: 数えながら返すので、列を 2 回読む必要がありません。
- **3 で頭打ちにする**: 回数を 3 で止めることで、何回重複しても回数が大きくなり続けず、「2 回目だけ」を正しく判定できます。
- **返すのは 1 回だけ**: 2 回目でだけ `2` になるので、同じ重複値を繰り返し返すことがありません。
- **比べ方を差し替えられる**: `comparer` を渡すと、大文字・小文字を区別しないなど、重複の判定基準を変えられます。

## まとめ

- `Duplicates` は、同じ値が 2 回目に現れた時点で、その値を 1 回だけ返す。
- 回数は `ScanBy` で数え、3 で頭打ちにしてから、ちょうど 2 のものを選ぶ。
- 1 回の走査で、比べ方の指定にも対応できる。
