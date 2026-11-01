---
title: "キーの集合にない要素だけを、重複なく順に返す"
description: "MoreLINQ の ExceptBy の中身。第 2 の列のキーを HashSet に入れ、第 1 の列から、キーが集合にない要素だけを返す。返した要素のキーは後から集合に加える。"
language: csharp
project: "MoreLINQ"
repo: https://github.com/morelinq/MoreLINQ
license: Apache-2.0
copyright: "Copyright (c) 2012 Atif Aziz. All rights reserved."
commit: "d217ab1e8eac68247650c27e977b767dd66bcab0"
file: MoreLinq/ExceptBy.cs
lines: [89, 99]
function: "MoreEnumerable.ExceptBy<TSource, TKey>(IEnumerable<TSource>, IEnumerable<TSource>, Func)"
difficulty: 2
format: 2
tags: [ハッシュ, アルゴリズム, 遅延評価]
---

## ひとことで

`ExceptBy(second, keySelector)` は、列 `first` の要素のうち、**キーが列 `second` のどのキーとも一致しない** ものだけを返す関数です。
たとえば、`first` が `1, 2, 2, 3` で、`second` のキーが `2` だけなら、結果は `1, 3` になります。

同じキーを持つ要素は、1 回だけ返されます。

## コード

::: code-group

```csharp:line-numbers=89 [日本語訳]
            {
                // TODO: ToHashSet を使うように直す
                var keys = new HashSet<TKey>(second.Select(keySelector), keyComparer);
                foreach (var element in first)
                {
                    var key = keySelector(element);
                    if (keys.Contains(key))
                        continue;
                    yield return element;
                    _ = keys.Add(key);
                }
```

```csharp:line-numbers=89 [原文]
            {
                // TODO Use ToHashSet
                var keys = new HashSet<TKey>(second.Select(keySelector), keyComparer);
                foreach (var element in first)
                {
                    var key = keySelector(element);
                    if (keys.Contains(key))
                        continue;
                    yield return element;
                    _ = keys.Add(key);
                }
```

:::

## 前提知識

- **`HashSet<TKey>`**: 同じ値を重複して入れない集合です。`Contains` で、値があるかを素早く調べられます。
- **`keySelector`**: 要素から、比べるためのキーを取り出す関数です。
- **`keyComparer`**: キーの等しさを決める道具です。省略すると、既定の比べ方を使います。
- **`_ = keys.Add(key);`**: `Add` の戻り値（追加できたか）を捨てる書き方です。
- **`continue`**: 繰り返しの途中で、残りを飛ばして次の要素へ進む書き方です。

## 何をしているか

### 1. 第 2 の列のキーを集合にする

```csharp:line-numbers=91
                var keys = new HashSet<TKey>(second.Select(keySelector), keyComparer);
```

`second` の各要素からキーを作り、`HashSet` に入れます。ここで、除外するキーの一覧ができます。

### 2. 第 1 の列を順に読む

```csharp:line-numbers=92
                foreach (var element in first)
                {
                    var key = keySelector(element);
```

`first` の要素を先頭から取り出し、そのキーを作ります。

### 3. 集合にあるキーは飛ばす

```csharp:line-numbers=95
                    if (keys.Contains(key))
                        continue;
```

キーが集合に入っていれば、除外するので `continue` で次の要素へ進みます。

### 4. 残りは返し、キーを加える

```csharp:line-numbers=97
                    yield return element;
                    _ = keys.Add(key);
```

キーが集合になければ、要素を返します。そのあとで、キーを集合に加えます。加えておくので、同じキーを持つ後ろの要素は、重複として飛ばされます。

## ここがすごい

- **集合で素早く判定**: 第 2 の列を何度も探さずに、`HashSet` の 1 回の検索で判定します。
- **重複も一緒に取り除く**: 返したキーを即座に集合へ入れるので、結果は同じキーを 1 回しか含みません。
- **比べ方を差し替えられる**: `keyComparer` で、大文字小文字を区別しないなどの比べ方が使えます。

## まとめ

- 第 2 の列のキーを集合に入れる。
- 第 1 の列を順に読み、集合にないキーの要素だけを返す。
- 返したキーは集合に加え、重複を後ろの要素から除く。
