---
title: "区切りの要素で列を分け、最大の回数まで区切る"
description: "MoreLINQ の Split（区切りの判定と回数の指定）。区切りに当たった要素を捨てて、その前後のかたまりを順に返す。指定の回数を使い切ったら、それ以降は区切らずに残りを 1 つにまとめる。"
language: csharp
project: "MoreLINQ"
repo: https://github.com/morelinq/MoreLINQ
license: Apache-2.0
copyright: "Copyright (c) 2012 Atif Aziz. All rights reserved."
commit: "d217ab1e8eac68247650c27e977b767dd66bcab0"
file: MoreLinq/Split.cs
lines: [272, 304]
function: "MoreEnumerable.Split<TSource, TResult>（区切りの回数を指定する版の内部処理）"
difficulty: 3
format: 2
tags: [イテレータ, 遅延評価, アルゴリズム]
---

## ひとことで

`Split` は、列を **区切りの要素** で分けて、かたまりの列にする関数です。
区切りの判定は、関数で決めます。たとえば `1, 0, 2, 3, 0, 4` を `0` で区切ると、`[1]`, `[2, 3]`, `[4]` の 3 つのかたまりになります。

この部分は、区切りを使う回数の上限も指定できる版の中身です。上限に達すると、それ以降の区切りは普通の要素として扱われます。

## コード

::: code-group

```csharp:line-numbers=272 [日本語訳]
            static IEnumerable<TResult> _(
                IEnumerable<TSource> source,
                Func<TSource, bool> separatorFunc,
                int count,
                Func<IEnumerable<TSource>, TResult> resultSelector)
            {
                if (count == 0) // 分割しないので、列全体を 1 つの結果として返す。
                {
                    yield return resultSelector(source);
                }
                else
                {
                    List<TSource>? items = null;

                    foreach (var item in source)
                    {
                        if (count > 0 && separatorFunc(item))
                        {
                            yield return resultSelector(items ?? Enumerable.Empty<TSource>());
                            count--;
                            items = null;
                        }
                        else
                        {
                            items ??= [];
                            items.Add(item);
                        }
                    }

                    if (items is { Count: > 0 })
                        yield return resultSelector(items);
                }
            }
```

```csharp:line-numbers=272 [原文]
            static IEnumerable<TResult> _(
                IEnumerable<TSource> source,
                Func<TSource, bool> separatorFunc,
                int count,
                Func<IEnumerable<TSource>, TResult> resultSelector)
            {
                if (count == 0) // No splits?
                {
                    yield return resultSelector(source);
                }
                else
                {
                    List<TSource>? items = null;

                    foreach (var item in source)
                    {
                        if (count > 0 && separatorFunc(item))
                        {
                            yield return resultSelector(items ?? Enumerable.Empty<TSource>());
                            count--;
                            items = null;
                        }
                        else
                        {
                            items ??= [];
                            items.Add(item);
                        }
                    }

                    if (items is { Count: > 0 })
                        yield return resultSelector(items);
                }
            }
```

:::

## 前提知識

- **区切り（separator）**: かたまりを分ける目印になる要素です。区切りそのものは、結果に含まれません。
- **`List<T>`**: 伸び縮みする配列です。今のかたまりの要素を溜めるために使います。
- **`??`（null 合体演算子）**: 左の値が `null` のときだけ、右の値を使う書き方です。
- **`Enumerable.Empty`**: 要素のない空の列です。区切りが続いたときの空のかたまりに使います。
- **`count`**: 残りの区切りの回数です。区切るたびに 1 減ります。

## 何をしているか

### 1. 分割しない場合

```csharp:line-numbers=278
                if (count == 0) // 分割しないので、列全体を 1 つの結果として返す。
                {
                    yield return resultSelector(source);
```

回数が 0 のときは、区切りを使わずに、列全体を 1 つの結果として返します。

### 2. 要素を溜めながら区切る

```csharp:line-numbers=286
                    foreach (var item in source)
                    {
                        if (count > 0 && separatorFunc(item))
                        {
                            yield return resultSelector(items ?? Enumerable.Empty<TSource>());
                            count--;
                            items = null;
                        }
```

要素を順に読み、区切りの判定が `true` で、まだ回数が残っていれば、溜めたかたまりを返します。回数を 1 減らし、溜める場所を空に戻します。

### 3. 区切り以外は溜める

```csharp:line-numbers=294
                        else
                        {
                            items ??= [];
                            items.Add(item);
                        }
```

区切りでなければ、要素を今のかたまりに追加します。

### 4. 最後のかたまりを返す

```csharp:line-numbers=301
                    if (items is { Count: > 0 })
                        yield return resultSelector(items);
```

列の終わりに、溜めた要素が残っていれば、それを最後のかたまりとして返します。末尾が区切りで終わった場合は、空のかたまりは返しません。

### 具体例で確かめる

`1, 0, 2, 3, 0, 4` を、回数の上限なしで `0` で区切ります。

```
1 を溜める → [1]
0 → 区切り → [1] を返す
2, 3 を溜める → [2, 3]
0 → 区切り → [2, 3] を返す
4 を溜める → [4]
終わり → [4] を返す
```

## ここがすごい

- **区切りの判定を自由に決められる**: 値そのものの一致だけでなく、任意の条件で区切れます。
- **区切りが続くと空のかたまりが出る**: 連続した区切りの間は、空の結果になります。データの形を、そのまま反映できます。
- **回数の上限で動きを変える**: 上限に達した後は、区切りも普通の要素として残すので、先頭の数回だけ分ける、という使い方ができます。
- **1 回の走査で済む**: 列を先頭から読みながら、かたまりを作ります。

## まとめ

- `Split` は、区切りの判定で列を分け、区切りの前後のかたまりを順に返す。
- 回数の上限に達すると、以降の区切りも普通の要素として扱う。
- 末尾が区切りなら、空のかたまりは返さない。
