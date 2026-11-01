---
title: "隣り合う 2 つの要素を 1 回ずつ見る Pairwise"
description: "列の「直前の要素」を覚えておくだけで、隣り合う 2 要素の組を 1 回の走査で処理する MoreLINQ の Pairwise。"
language: csharp
project: "MoreLINQ"
repo: https://github.com/morelinq/MoreLINQ
license: Apache-2.0
copyright: "Copyright (c) 2012 Atif Aziz. All rights reserved."
commit: "d217ab1e8eac68247650c27e977b767dd66bcab0"
file: MoreLinq/Pairwise.cs
lines: [51, 72]
function: "MoreEnumerable.Pairwise"
difficulty: 1
format: 2
tags: [イテレータ, 遅延評価, イディオム]
---

## ひとことで

`Pairwise` は、列の **隣り合う 2 つの要素** を組にして、関数 `resultSelector` に渡して結果を作る関数です。
たとえば `[1, 3, 6, 10]` に `(a, b) => b - a` を使うと、`[2, 3, 4]` が得られます。

LINQ（C# の標準的な列の操作機能）にはない操作なので、MoreLINQ が追加しています。

## コード

```csharp:line-numbers=51
        public static IEnumerable<TResult> Pairwise<TSource, TResult>(this IEnumerable<TSource> source, Func<TSource, TSource, TResult> resultSelector)
        {
            if (source == null) throw new ArgumentNullException(nameof(source));
            if (resultSelector == null) throw new ArgumentNullException(nameof(resultSelector));

            return _(source, resultSelector);

            static IEnumerable<TResult> _(IEnumerable<TSource> source, Func<TSource, TSource, TResult> resultSelector)
            {
                using var e = source.GetEnumerator();

                if (!e.MoveNext())
                    yield break;

                var previous = e.Current;
                while (e.MoveNext())
                {
                    yield return resultSelector(previous, e.Current);
                    previous = e.Current;
                }
            }
        }
```

## 前提知識

- **`IEnumerable<T>`**: 順番に要素を取り出せる「列」の型です。`foreach` で 1 つずつ読めます。
- **`Func<TSource, TSource, TResult>`**: 引数を 2 つ受け取り、結果を返す関数の型です。`(a, b) => b - a` のような匿名関数を渡せます。
- **`using var e = ...`**: スコープを抜けるときに `Dispose()` が自動で呼ばれる宣言です。列の読み取り用の道具（列挙子）を確実に片付けます。
- **`yield return` / `yield break`**: 列を 1 つずつ返す（`yield return`）、列を終わらせる（`yield break`）書き方です。関数は呼ばれた時点では何もせず、読まれたときに少しずつ動きます。
- **`static` のローカル関数 `_`**: 外側の関数の中に書いた関数です。`static` を付けると外の変数を捕まえられず、余計なオブジェクトが作られません。

## 何をしているか

### 1. 最初の要素を読む

```csharp:line-numbers=58
            static IEnumerable<TResult> _(IEnumerable<TSource> source, Func<TSource, TSource, TResult> resultSelector)
            {
                using var e = source.GetEnumerator();

                if (!e.MoveNext())
                    yield break;
```

`e.MoveNext()` は次の要素があれば `true` を返し、その要素を `e.Current` に置きます。最初の要素が無ければ空の列なので、何も返さずに終わります。

### 2. 直前の要素を覚えながら進む

```csharp:line-numbers=65
                var previous = e.Current;
                while (e.MoveNext())
                {
                    yield return resultSelector(previous, e.Current);
                    previous = e.Current;
                }
```

`previous` に「1 つ前の要素」を入れておき、次の要素が来るたびに `resultSelector(previous, e.Current)` を返します。そのあとで `previous` を今の要素に更新します。

`[1, 3, 6, 10]` の場合は次のように進みます。

```
最初:  previous = 1
3 が来る: 返す (1, 3) → 2, previous = 3
6 が来る: 返す (3, 6) → 3, previous = 6
10 が来る: 返す (6, 10) → 4, previous = 10
```

## ここがすごい

- **1 回の走査で済む**: 配列の添字を使って `list[i]` と `list[i + 1]` を読む方法は、列が配列でないと使えません。この関数は要素を 1 回ずつ読むので、どんな `IEnumerable<T>` にも使えます。
- **元の列を全部持たない**: 直前の 1 つだけを覚えるので、列が長くても追加のメモリはほぼ使いません。
- **遅延評価**: `Pairwise` を呼んだ時点では計算しません。結果を `foreach` で読んだときに初めて動きます。だから無限に続く列にも使えます。
- **引数の確認を先にする**: 外側の関数で `null` チェックを済ませてから、中のイテレータを返しています。イテレータは読まれるまで動かないので、エラーが遅れて出るのを防ぐための書き方です。

## まとめ

- 「直前の値」を 1 つだけ覚えておけば、隣り合う組を 1 回の走査で処理できる。
- `yield` を使うと、列を作る処理を読まれるたびに少しずつ進められる。
- 配列の添字に頼らないと、どんな列にも同じ処理を書ける。
