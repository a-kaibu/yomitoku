---
title: "途中の合計を、一つずつ返しながら集計する"
description: "MoreLINQ の Scan。種の値から始めて要素を一つずつ足し込み、途中経過をすべて返す。Aggregate が最後の結果だけを返すのに対して、Scan は途中の値を全部見られる。"
language: csharp
project: "MoreLINQ"
repo: https://github.com/morelinq/MoreLINQ
license: Apache-2.0
copyright: "Copyright (c) 2012 Atif Aziz. All rights reserved."
commit: "d217ab1e8eac68247650c27e977b767dd66bcab0"
file: MoreLinq/Scan.cs
lines: [83, 110]
function: "MoreEnumerable.Scan<TSource, TState>(IEnumerable<TSource>, TState, Func<TState, TSource, TState>)"
difficulty: 2
format: 2
tags: [イテレータ, 遅延評価, アルゴリズム]
---

## ひとことで

`Scan` は、列を先頭から順に集計しながら、**途中の集計結果を一つずつ返す** 関数です。
たとえば `[1, 2, 3, 4]` を種 `0` から足し込むと、`1, 3, 6, 10` と順に返ります。

LINQ の `Aggregate` は最後の合計しか返しません。`Scan` は、途中の値も必要なときに使います。

## コード

```csharp:line-numbers=83
        public static IEnumerable<TState> Scan<TSource, TState>(this IEnumerable<TSource> source,
            TState seed, Func<TState, TSource, TState> transformation)
        {
            if (source == null) throw new ArgumentNullException(nameof(source));
            if (transformation == null) throw new ArgumentNullException(nameof(transformation));

            return ScanImpl(source, transformation, _ => (true, seed));
        }

        static IEnumerable<TState> ScanImpl<TSource, TState>(IEnumerable<TSource> source,
            Func<TState, TSource, TState> transformation,
            Func<IEnumerator<TSource>, (bool, TState)> seeder)
        {
            using var e = source.GetEnumerator();

            var (seeded, aggregator) = seeder(e);

            if (!seeded)
                yield break;

            yield return aggregator;

            while (e.MoveNext())
            {
                aggregator = transformation(aggregator, e.Current);
                yield return aggregator;
            }
        }
```

## 前提知識

- **集計（しゅうけい）**: 列の値を 1 つにまとめることです。合計、積、最大などがあります。
- **種（seed）**: 集計を始めるときの初期値です。合計なら `0`、積なら `1` を使います。
- **変換関数**: 今までの集計結果と、次の要素を受け取り、新しい集計結果を返す関数です。
- **`using var`**: 列挙子（列を 1 つずつ読む道具）を、関数を抜けるときに後片付けします。
- **`yield return`**: 途中の値を 1 つずつ呼び出し元へ返す書き方です。

## 何をしているか

### 1. 列挙子を用意し、種を得る

```csharp:line-numbers=96
            using var e = source.GetEnumerator();

            var (seeded, aggregator) = seeder(e);
```

列の列挙子を作り、種から最初の集計値を決めます。`seeded` は、そもそも始められるかを表す値です。種を使う版では、いつも `true` になります。

```csharp:line-numbers=100
            if (!seeded)
                yield break;
```

始められない場合は、何も返さず終わります。

### 2. 最初の集計値を返す

```csharp:line-numbers=103
            yield return aggregator;
```

種の値は、最初の要素を加える前の値ですが、そのまま最初の結果として返します。

### 3. 次の要素を足し込みながら返す

```csharp:line-numbers=105
            while (e.MoveNext())
            {
                aggregator = transformation(aggregator, e.Current);
                yield return aggregator;
            }
```

列に次の要素がある限り、変換関数で集計値を更新し、そのたびに `yield return` します。

## ここがすごい

- **途中経過が見える**: 合計が増えていく様子を、そのまま列として取り出せます。移動する値の変化を追う処理に向いています。
- **遅延して返す**: 結果を全部まとめて作らず、要求されたときに 1 つずつ計算します。
- **最後の値も得られる**: `.Last()` を付ければ、`Aggregate` と同じ最終結果が得られます。
- **種が必要な形を分けている**: 種を使う版と使わない版を、内部の `ScanImpl` で共通化しています。

## まとめ

- `Scan` は、種から集計を始め、途中の結果を 1 つずつ返す。
- 集計値は、要素を 1 つ足すたびに更新される。
- 最後の値だけ欲しいなら `Aggregate`、途中経過も欲しいなら `Scan` を使う。
