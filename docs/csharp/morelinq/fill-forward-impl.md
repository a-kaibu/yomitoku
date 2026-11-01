---
title: "空の値を、直前に見た値で埋める処理の中身"
description: "MoreLINQ の FillForward の中身。直前に通った値を seed に覚えておき、条件に当たる要素はその値で置き換える。"
language: csharp
project: "MoreLINQ"
repo: https://github.com/morelinq/MoreLINQ
license: Apache-2.0
copyright: "Copyright (c) 2012 Atif Aziz. All rights reserved."
commit: "d217ab1e8eac68247650c27e977b767dd66bcab0"
file: MoreLinq/FillForward.cs
lines: [107, 127]
function: "MoreEnumerable.FillForwardImpl<T>(IEnumerable<T>, Func<T, bool>, Func<T, T, T>?)"
difficulty: 2
format: 2
tags: [イテレータ, 遅延評価, 状態機械]
---

## ひとことで

`FillForward` は、列の中で **空の値（欠けた値）** を見つけたら、**直前に見た値で埋める** 関数です。
たとえば `1, null, null, 4` を埋めると、`1, 1, 1, 4` になります。

この関数の中身は、直前の値を覚えておく小さな仕組みです。

## コード

```csharp:line-numbers=107
        static IEnumerable<T> FillForwardImpl<T>(IEnumerable<T> source, Func<T, bool> predicate, Func<T, T, T>? fillSelector)
        {
            (bool, T) seed = default;

            foreach (var item in source)
            {
                if (predicate(item))
                {
                    yield return seed is (true, var theSeed)
                               ? fillSelector != null
                                 ? fillSelector(item, theSeed)
                                 : theSeed
                               : item;
                }
                else
                {
                    seed = (true, item);
                    yield return item;
                }
            }
        }
```

## 前提知識

- **`predicate`**: 要素を受け取り、「空の値かどうか」を `true` か `false` で返す関数です。ここでは `e == null` などが入ります。
- **組（タプル） `(bool, T)`**: 2 つの値をまとめて扱う型です。前の `bool` は「値を覚えているか」、後ろの `T` は「覚えている値」です。
- **`default`**: 型の既定値を表す書き方です。参照型なら `null`、数値なら `0` になります。
- **パターン `is (true, var theSeed)`**: 組の中身を調べて、先頭が `true` のときだけ後ろの値を `theSeed` という名前で取り出す書き方です。
- **`yield return`**: 値を 1 つずつ返す書き方です。遅延評価（必要になったときに 1 つずつ計算すること）に使われます。

## 何をしているか

### 1. 直前の値を入れる箱を用意する

```csharp:line-numbers=109
            (bool, T) seed = default;
```

`seed` は最初、中身のない状態（`(false, default)`）です。まだ一度も値を見ていない、という意味になります。

### 2. 要素を順に見て、空かどうかを調べる

```csharp:line-numbers=111
            foreach (var item in source)
            {
                if (predicate(item))
```

列を先頭から 1 つずつ取り出し、`predicate` で「空の値かどうか」を調べます。

### 3. 空の値なら、覚えている値で埋める

```csharp:line-numbers=115
                    yield return seed is (true, var theSeed)
                               ? fillSelector != null
                                 ? fillSelector(item, theSeed)
                                 : theSeed
                               : item;
```

空の値のとき、箱に値があれば、その値を返します。`fillSelector` が指定されていれば、その関数で「元の値」と「覚えている値」を組み合わせた結果を返します。箱に値がまだなければ、空の値をそのまま返します。

### 4. 空でなければ、箱に覚えてそのまま返す

```csharp:line-numbers=121
                else
                {
                    seed = (true, item);
                    yield return item;
```

空でない値は、箱に入れて、そのまま返します。次に空の値が来たとき、この値で埋められます。

## ここがすごい

- **状態は 1 つだけ**: 覚えておくのは直前の値 1 つだけです。列全体を保存しないので、長い列でもメモリを使いません。
- **先頭の空は埋めない**: 箱に値がまだないとき、空の値はそのまま返します。埋める値が存在しないからです。
- **遅延評価**: `yield return` で 1 つずつ返すため、列全体を先に作らずに済みます。

## まとめ

- 直前に見た値を `seed` という箱に覚えておく。
- 空の値が来たら、箱の値で埋めて返す。
- 空でない値は箱に入れて、そのまま返す。
