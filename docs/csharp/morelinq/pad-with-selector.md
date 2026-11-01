---
title: "足りない分だけ、位置に応じた埋め物を後ろに足す"
description: "MoreLINQ の Pad。列が指定の長さに満たないとき、後ろに埋め物を足して長さをそろえる。埋め物を位置から計算する版では、番号ごとに異なる値を入れられる。"
language: csharp
project: "MoreLINQ"
repo: https://github.com/morelinq/MoreLINQ
license: Apache-2.0
copyright: "Copyright (c) 2012 Atif Aziz. All rights reserved."
commit: "d217ab1e8eac68247650c27e977b767dd66bcab0"
file: MoreLinq/Pad.cs
lines: [116, 132]
function: "MoreEnumerable.Pad<TSource>(IEnumerable<TSource>, int, Func<int, TSource>)"
difficulty: 2
format: 2
tags: [イテレータ, 遅延評価, 可読性]
---

## ひとことで

`Pad(width, paddingSelector)` は、列が `width` 個より短いときに、**後ろへ埋め物を足して** 長さを `width` にそろえる関数です。
たとえば `{ 0, 1, 2 }` に `Pad(5, i => -i)` を使うと、`0, 1, 2, -3, -4` になります。埋め物は、何番目かの位置を使って計算されます。

表の列を揃えたり、固定長のデータを作ったりするときに役立ちます。

## コード

```csharp:line-numbers=116
        static IEnumerable<T> PadImpl<T>(IEnumerable<T> source, int width,
                                         T? padding, Func<int, T>? paddingSelector)
        {
            Debug.Assert(width >= 0);

            var count = 0;
            foreach (var item in source)
            {
                yield return item;
                count++;
            }
            while (count < width)
            {
                yield return paddingSelector != null ? paddingSelector(count) : padding!;
                count++;
            }
        }
```

## 前提知識

- **埋め物（パディング）**: 長さを揃えるために後ろへ足す値です。`0` や空白などがよく使われます。
- **`Func<int, TSource>`**: 整数（位置）を受け取り、値を返す関数です。ここでは、埋め物を作るための関数として使います。
- **`T?`**: 値が無いことを表せる型です。埋め物を固定値で渡さないときは `default` が使われます。
- **`foreach` と `yield return`**: 元の列の要素を順に返してから、足りない分を返す書き方です。
- **`count`**: ここまでに返した要素の数です。埋め物の位置を決めるために使います。

## 何をしているか

### 1. 元の列をそのまま返す

```csharp:line-numbers=121
            var count = 0;
            foreach (var item in source)
            {
                yield return item;
                count++;
            }
```

元の列の要素を先に全部返し、そのたびに `count` を 1 増やします。

### 2. 足りない分を埋め物で返す

```csharp:line-numbers=127
            while (count < width)
            {
                yield return paddingSelector != null ? paddingSelector(count) : padding!;
                count++;
            }
```

`count` が `width` に届くまで、埋め物を返し続けます。埋め物の関数には、そのときの `count` が渡されます。固定値を使う版では、同じ値を返します。

### 具体例で確かめる

`{ 0, 1, 2 }` に `Pad(5, i => -i)` を使うと、次のようになります。

```
元の列:    0, 1, 2     （count は 3 になる）
埋め物:   paddingSelector(3) = -3, paddingSelector(4) = -4
結果:      0, 1, 2, -3, -4
```

## ここがすごい

- **埋め物を位置から作れる**: 固定の値では表せない、「位置に応じた番号」などを入れられます。
- **元の列を先に流す**: 足りない分の判定は、列を読み終わった後だけ行います。長い列でも、1 回の走査で済みます。
- **遅延して返す**: 結果を全部作らず、要求されたときに 1 つずつ返します。
- **長い列は何もしない**: すでに `width` 以上あれば、埋め物は 1 つも足されず、元の列がそのまま返ります。

## まとめ

- `Pad` は、列が `width` に満たないとき、後ろに埋め物を足して長さを揃える。
- 埋め物は、位置（`count`）を受け取る関数で作れる。
- 元の列を先に返し、足りない分だけ埋め物を返すので、1 回の走査で済む。
