---
title: "列の末尾の数個を、数えてから取り除く"
description: "MoreLINQ の SkipLast。末尾の count 個だけを除き、それより前の要素を返す。CountDown で末尾からの番号を付け、番号が null でなくなるまでを取り出す。"
language: csharp
project: "MoreLINQ"
repo: https://github.com/morelinq/MoreLINQ
license: Apache-2.0
copyright: "Copyright (c) 2012 Atif Aziz. All rights reserved."
commit: "d217ab1e8eac68247650c27e977b767dd66bcab0"
file: MoreLinq/SkipLast.cs
lines: [41, 48]
function: "MoreEnumerable.SkipLast<T>(IEnumerable<T>, int)"
difficulty: 2
format: 2
tags: [イテレータ, 遅延評価, アルゴリズム]
---

## ひとことで

`SkipLast(count)` は、列の **末尾の `count` 個を取り除いた** 列を返す関数です。
たとえば `1, 2, 3, 4, 5` に `SkipLast(2)` を使うと、`1, 2, 3` が返ります。

列の長さが事前に分からなくても使えます。末尾の要素を判定するために、前に説明した `CountDown` を使っています。

## コード

```csharp:line-numbers=41
        {
            if (source == null) throw new ArgumentNullException(nameof(source));

            return count < 1 ? source
                 : source.CountDown(count, (e, cd) => (Element: e, Countdown: cd))
                         .TakeWhile(e => e.Countdown == null)
                         .Select(e => e.Element);
        }
```

## 前提知識

- **`CountDown`**: 末尾からの番号を、要素と一緒に付ける関数です。末尾が `0`、その前が `1` と数えます。番号が付かない要素には `null` が付きます。
- **`TakeWhile`**: 条件を満たす間だけ、要素を取り出す LINQ の関数です。条件を満たさなくなった時点で止まります。
- **`Select`**: 要素を別の形に変える LINQ の関数です。ここでは、番号の付いた組から、要素だけを取り出します。
- **三項演算子 `?:`**: 条件によって 2 つのうち 1 つを選ぶ書き方です。
- **匿名の組（`(Element: e, Countdown: cd)`）**: 名前付きの組を、その場で作る書き方です。

## 何をしているか

### 1. 取り除く数が 1 未満なら、そのまま返す

```csharp:line-numbers=44
            return count < 1 ? source
```

`count` が 1 より小さければ、取り除くものがないので、列をそのまま返します。

### 2. 末尾からの番号を付ける

```csharp:line-numbers=45
                 : source.CountDown(count, (e, cd) => (Element: e, Countdown: cd))
```

`CountDown` で、各要素に末尾からの番号を付けます。番号は、要素と組にして扱います。

### 3. 番号が付いていない要素だけを取り出す

```csharp:line-numbers=46
                         .TakeWhile(e => e.Countdown == null)
```

番号が `null` の間だけ `TakeWhile` で取り出します。番号が `null` でなくなった時点で止まるので、末尾の `count` 個は含まれません。

### 4. 要素だけを返す

```csharp:line-numbers=47
                         .Select(e => e.Element);
```

組から要素だけを取り出して、結果とします。

### 具体例で確かめる

`1, 2, 3, 4, 5` に `SkipLast(2)` を使うと、次のようになります。

```
CountDown(2) の結果:
  1 → null
  2 → null
  3 → 1
  4 → 0
  5 → 取り出し（番号が 0 のため、末尾 2 個の中）
TakeWhile（番号が null の間）→ 1, 2, 3
```

`3` の番号は `1` なので、ここで止まり、`4` と `5` は含まれません。

## ここがすごい

- **既存の部品を組み合わせる**: 番号付けを `CountDown` に任せ、取り出しを `TakeWhile` にすることで、短く書けています。
- **長さが分からなくても使える**: 列の全体を先に数えなくても、末尾の数個を正しく除けます。
- **少ない記憶で済む**: `CountDown` は直近の `count` 個だけを手元に置くので、大きな列でも必要なメモリは少なく済みます。
- **0 個なら何もしない**: 取り除く数が 1 未満なら、列を読まずにそのまま返すので、無駄な処理がありません。

## まとめ

- `SkipLast` は、末尾の `count` 個を除いた列を返す。
- `CountDown` で末尾からの番号を付け、番号が `null` の要素だけを残す。
- 取り除く数が 1 未満なら、列をそのまま返す。
