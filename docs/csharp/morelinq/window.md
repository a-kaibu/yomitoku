---
title: "要素を 1 個ずつずらしながら、size 個ずつの窓を取り出す"
description: "MoreLINQ の Window。列の上を大きさ size の窓が 1 つずつ滑るように、連続する要素のまとまりを返す。移動平均や前後の比較など、隣り合う要素を見る処理の土台になる。"
language: csharp
project: "MoreLINQ"
repo: https://github.com/morelinq/MoreLINQ
license: Apache-2.0
copyright: "Copyright (c) 2012 Atif Aziz. All rights reserved."
commit: "d217ab1e8eac68247650c27e977b767dd66bcab0"
file: MoreLinq/Window.cs
lines: [49, 76]
function: "MoreEnumerable.Window<TSource>(IEnumerable<TSource>, int)"
difficulty: 2
format: 2
tags: [イテレータ, 遅延評価, アルゴリズム]
---

## ひとことで

`Window(size)` は、列の上を **大きさ `size` の窓が 1 要素ずつ滑っていく** ように、連続した要素のまとまりを順に返す関数です。
たとえば `[1, 2, 3, 4]` を `Window(3)` にかけると、`[1, 2, 3]` と `[2, 3, 4]` の 2 つが返ります。

移動平均や「前後の値との比較」など、隣り合う要素をまとめて見たい処理の土台になります。

## コード

::: code-group

```csharp:line-numbers=49 [日本語訳]
            static IEnumerable<IList<TSource>> _(IEnumerable<TSource> source, int size)
            {
                using var iter = source.GetEnumerator();

                // 最初の窓（size 個分）を作る。
                var window = new TSource[size];
                int i;
                for (i = 0; i < size && iter.MoveNext(); i++)
                    window[i] = iter.Current;

                if (i < size)
                    yield break;

                while (iter.MoveNext())
                {
                    // 次の窓は、1 つ分ずらして作る。
                    // 値を外に返す（yield する）前に、ずらす処理をすませる。
                    var newWindow = new TSource[size];
                    Array.Copy(window, 1, newWindow, 0, size - 1);
                    newWindow[size - 1] = iter.Current;

                    yield return window;
                    window = newWindow;
                }

                // 最後の窓を返す。
                yield return window;
            }
```

```csharp:line-numbers=49 [原文]
            static IEnumerable<IList<TSource>> _(IEnumerable<TSource> source, int size)
            {
                using var iter = source.GetEnumerator();

                // generate the first window of items
                var window = new TSource[size];
                int i;
                for (i = 0; i < size && iter.MoveNext(); i++)
                    window[i] = iter.Current;

                if (i < size)
                    yield break;

                while (iter.MoveNext())
                {
                    // generate the next window by shifting forward by one item
                    // and do that before exposing the data
                    var newWindow = new TSource[size];
                    Array.Copy(window, 1, newWindow, 0, size - 1);
                    newWindow[size - 1] = iter.Current;

                    yield return window;
                    window = newWindow;
                }

                // return the last window.
                yield return window;
            }
```

:::

## 前提知識

- **窓（ウィンドウ）**: 列の一部分を切り取ったものです。大きさを決めておき、その範囲の要素だけを見ます。
- **`IEnumerator`**: 列を先頭から 1 つずつ取り出すための道具です。`MoveNext()` で次へ進み、`Current` で値を読みます。
- **`yield return`**: 値を 1 つ返して、続きは次に要求されたときに再開する書き方です。
- **`Array.Copy`**: 配列の一部分を別の配列へコピーします。`Array.Copy(元, 元の開始位置, 先, 先の開始位置, 個数)` の形で書きます。
- **`using var`**: ブロックを抜けるときに、`iter` の後片付け（`Dispose`）を自動で行います。

## 何をしているか

### 1. 最初の窓を作る

```csharp:line-numbers=53
                // 最初の窓（size 個分）を作る。
                var window = new TSource[size];
                int i;
                for (i = 0; i < size && iter.MoveNext(); i++)
                    window[i] = iter.Current;

                if (i < size)
                    yield break;
```

先頭から `size` 個を読んで、最初の窓を作ります。途中で列が尽きたら、窓が作れないので何も返さずに終わります。

### 2. 1 つずらして次の窓を作る

```csharp:line-numbers=62
                while (iter.MoveNext())
                {
                    // 次の窓は、1 つ分ずらして作る。
                    // 値を外に返す（yield する）前に、ずらす処理をすませる。
                    var newWindow = new TSource[size];
                    Array.Copy(window, 1, newWindow, 0, size - 1);
                    newWindow[size - 1] = iter.Current;
```

列に次の要素がある限り、窓を 1 つ左へずらします。`Array.Copy` で後ろの `size - 1` 個を前に詰め、末尾に新しい要素を入れます。

### 3. 窓を返して入れ替える

```csharp:line-numbers=70
                    yield return window;
                    window = newWindow;
```

ずらす前の窓を返し、新しい窓を次の基準にします。

```csharp:line-numbers=74
                // 最後の窓を返す。
                yield return window;
```

列の最後まで来たら、最後の窓を 1 回だけ返して終わります。

### 注意：窓ごとに新しい配列を作る

コードでは、窓を返すたびに `new TSource[size]` で新しい配列を作っています。そのため、呼び出し側が窓を保存しても、後から中身が書き換わる心配がありません。

## ここがすごい

- **1 回の読み込みで済む**: 各要素は 1 回だけ `MoveNext` されます。窓の中身を毎回すべて数え直す必要がありません。
- **遅延して返す**: `yield return` により、列の全体を先に読み込まず、必要な分だけ窓を作れます。
- **短い列には何も返さない**: 最初から `size` 個ない場合は `yield break` で空の結果になり、半端な窓が混ざりません。
- **窓の配列を分ける**: 返した配列を次の処理で書き換えない、という安全な作りになっています。

## まとめ

- `Window` は、大きさ `size` の窓を 1 要素ずつずらして、連続した要素のまとまりを返す。
- 最初の窓を作り、1 つずらすたびに新しい窓を作って返す。
- 列が `size` 個未満のときは何も返さない。
