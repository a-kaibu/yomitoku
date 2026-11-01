---
title: "列の指定した位置に、別の列を差し込む"
description: "MoreLINQ の Insert。先頭の列の index 番目の位置まで読み、そこに 2 つ目の列を挿入してから、残りを続ける。挿入位置が長さを超えたら例外。"
language: csharp
project: "MoreLINQ"
repo: https://github.com/morelinq/MoreLINQ
license: Apache-2.0
copyright: "Copyright (c) 2012 Atif Aziz. All rights reserved."
commit: "d217ab1e8eac68247650c27e977b767dd66bcab0"
file: MoreLinq/Insert.cs
lines: [60, 77]
function: "MoreEnumerable.Insert<T>(IEnumerable<T>, IEnumerable<T>, int)"
difficulty: 2
format: 2
tags: [イテレータ, 遅延評価, エラー処理]
---

## ひとことで

`Insert(second, index)` は、列 `first` の **`index` 番目の位置に、列 `second` を差し込む** 関数です。
たとえば `a, b, c` の位置 1 に `X, Y` を差し込むと、`a, X, Y, b, c` になります。

元の列は書き換えず、差し込んだ結果を 1 つずつ返します。

## コード

```csharp:line-numbers=60
            static IEnumerable<T> _(IEnumerable<T> first, IEnumerable<T> second, int index)
            {
                var i = -1;

                using var iter = first.GetEnumerator();

                while (++i < index && iter.MoveNext())
                    yield return iter.Current;

                if (i < index)
                    throw new ArgumentOutOfRangeException(nameof(index), "Insertion index is greater than the length of the first sequence.");

                foreach (var item in second)
                    yield return item;

                while (iter.MoveNext())
                    yield return iter.Current;
            }
```

## 前提知識

- **`IEnumerator<T>`**: 列を 1 つずつ進める道具です。`MoveNext()` で次へ進み、`Current` で今の要素を読みます。
- **後置・前置のインクリメント（`++i`）**: 値を 1 増やしてから使う書き方です。ここでは、比較の前に番号を進めています。
- **`using var`**: この関数の終わりで、道具を自動的に片付ける書き方です。
- **`throw`**: 例外を投げて、処理を中断する書き方です。
- **遅延評価**: 結果を 1 つずつ返すので、必要になるまで列を読み進めません。

## 何をしているか

### 1. 列を読む道具を用意する

```csharp:line-numbers=62
                var i = -1;

                using var iter = first.GetEnumerator();
```

番号 `i` を −1 で用意し、`first` を読む道具を作ります。

### 2. 挿入位置まで要素を返す

```csharp:line-numbers=66
                while (++i < index && iter.MoveNext())
                    yield return iter.Current;
```

`++i` で番号を 1 つ進めながら、挿入位置の手前までの要素を順に返します。挿入位置に着いたら、ループを抜けます。

### 3. 位置が長さを超えていないか確かめる

```csharp:line-numbers=69
                if (i < index)
                    throw new ArgumentOutOfRangeException(nameof(index), "Insertion index is greater than the length of the first sequence.");
```

`i` が `index` より小さいままなら、`first` が挿入位置より短かったことになります。このときは例外を投げます。

### 4. 差し込む列を返す

```csharp:line-numbers=72
                foreach (var item in second)
                    yield return item;
```

`second` の要素を順に返します。

### 5. 残りの要素を返す

```csharp:line-numbers=75
                while (iter.MoveNext())
                    yield return iter.Current;
```

`first` の残りの要素を、順に返して終わります。

## ここがすごい

- **元の列を変えない**: 新しい列を作って返すので、もとの 2 つの列はそのまま残ります。
- **1 つずつ返す**: 差し込んだ列を全部並べた配列を作らず、必要な分だけ読みます。
- **位置の確認をする**: 列が短すぎるときに、何も知らせずに終わらず、例外で明示します。

## まとめ

- 挿入位置の手前までの要素を返す。
- 差し込む列の要素を返す。
- 残りの要素を返す。位置が長さを超えていれば例外にする。
