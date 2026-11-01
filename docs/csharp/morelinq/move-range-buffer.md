---
title: "列の一部を、別の位置へ移動させる"
description: "MoreLINQ の Move。移動する部分と間の要素を一時的にバッファに入れ、順番を組み直して返す。配列を作り直さずに、列の並びを変える。"
language: csharp
project: "MoreLINQ"
repo: https://github.com/morelinq/MoreLINQ
license: Apache-2.0
copyright: "Copyright (c) 2012 Atif Aziz. All rights reserved."
commit: "d217ab1e8eac68247650c27e977b767dd66bcab0"
file: MoreLinq/Move.cs
lines: [60, 88]
function: "MoreEnumerable.Move<T>(IEnumerable<T>, int, int, int)"
difficulty: 3
format: 2
tags: [アルゴリズム, 遅延評価, イテレータ]
---

## ひとことで

`Move(fromIndex, count, toIndex)` は、列の中の **連続した `count` 個の要素を、別の位置へ移す** 関数です。
たとえば `a, b, c, d, e` で、番号 1 から 1 個の `b` を番号 3 へ移すと、`a, c, d, b, e` になります。

移動する要素と、その間にある要素を一時的にバッファ（一時的に覚えておく領域）に入れて、順番を組み直します。

## コード

```csharp:line-numbers=60
            return toIndex < fromIndex
                 ? _(source, toIndex, fromIndex - toIndex, count)
                 : _(source, fromIndex, count, toIndex - fromIndex);

            static IEnumerable<T> _(IEnumerable<T> source, int bufferStartIndex, int bufferSize, int bufferYieldIndex)
            {
                var hasMore = true;
                bool MoveNext(IEnumerator<T> e) => hasMore && (hasMore = e.MoveNext());

                using var e = source.GetEnumerator();

                for (var i = 0; i < bufferStartIndex && MoveNext(e); i++)
                    yield return e.Current;

                var buffer = new T[bufferSize];
                var length = 0;

                for (; length < bufferSize && MoveNext(e); length++)
                    buffer[length] = e.Current;

                for (var i = 0; i < bufferYieldIndex && MoveNext(e); i++)
                    yield return e.Current;

                for (var i = 0; i < length; i++)
                    yield return buffer[i];

                while (MoveNext(e))
                    yield return e.Current;
            }
```

## 前提知識

- **インデックス**: 先頭から 0 で始まる番号です。
- **バッファ**: 一時的に要素を入れておく配列です。ここでは `T[]` の配列を使っています。
- **`IEnumerator<T>`**: 列を 1 つずつ進める道具です。`MoveNext()` で次へ進み、`Current` で今の要素を読みます。
- **ローカル関数**: メソッドの中で定義する関数です。`_` という名前で、外側の変数を使えます。
- **`yield return`**: 値を 1 つずつ返す書き方です。遅延評価（必要になったときに 1 つずつ計算すること）に使われます。

## 何をしているか

### 1. 移動の向きを決める

```csharp:line-numbers=60
            return toIndex < fromIndex
                 ? _(source, toIndex, fromIndex - toIndex, count)
                 : _(source, fromIndex, count, toIndex - fromIndex);
```

移動先が移動元より前なら、前側から順番を組み直します。後ろなら、後ろ側へ組み直します。どちらも、同じローカル関数 `_` を呼びます。引数の意味が違うだけです。

### 2. 先頭側の要素をそのまま返す

```csharp:line-numbers=71
                for (var i = 0; i < bufferStartIndex && MoveNext(e); i++)
                    yield return e.Current;
```

移動に関係しない先頭の要素を、順番どおりに返します。

### 3. 間の要素をバッファに入れる

```csharp:line-numbers=74
                var buffer = new T[bufferSize];
                var length = 0;

                for (; length < bufferSize && MoveNext(e); length++)
                    buffer[length] = e.Current;
```

動かす要素の前後にある、間の要素を配列 `buffer` に覚えておきます。ここで覚えた要素は、まだ返しません。

### 4. 移動する要素を返す

```csharp:line-numbers=80
                for (var i = 0; i < bufferYieldIndex && MoveNext(e); i++)
                    yield return e.Current;
```

動かす要素を先に返します。これで、移動先の位置に来ます。

### 5. バッファの要素を返し、残りを返す

```csharp:line-numbers=83
                for (var i = 0; i < length; i++)
                    yield return buffer[i];

                while (MoveNext(e))
                    yield return e.Current;
```

バッファに覚えた要素を、順番どおりに返します。最後に、残りの要素を全部返して終わります。

## ここがすごい

- **必要な分だけ覚える**: 全部の要素を配列に入れず、間にある要素だけをバッファに覚えます。
- **1 つの仕組みで両方向に対応**: 前へ移す場合と後ろへ移す場合を、引数だけを変えて同じ関数で処理しています。
- **遅延評価**: 結果は 1 つずつ返されるため、列全体を先に作らずに済みます。

## まとめ

- 移動先が前か後ろかで、引数の並びを変えて同じ処理を使う。
- 間にある要素は、バッファに覚えておく。
- 移動する要素を先に返し、バッファの要素を次に返す。
