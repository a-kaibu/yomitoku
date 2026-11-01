---
title: "列の末尾の数個だけを、数えて取り出す"
description: "MoreLINQ の TakeLast。CountDown で末尾からの番号を付け、番号が付いた要素だけを残す。SkipLast と同じ部品を、反対側の用途で使う。"
language: csharp
project: "MoreLINQ"
repo: https://github.com/morelinq/MoreLINQ
license: Apache-2.0
copyright: "Copyright (c) 2012 Atif Aziz. All rights reserved."
commit: "d217ab1e8eac68247650c27e977b767dd66bcab0"
file: MoreLinq/TakeLast.cs
lines: [52, 61]
function: "MoreEnumerable.TakeLast<TSource>(IEnumerable<TSource>, int)"
difficulty: 2
format: 2
tags: [イテレータ, 遅延評価, アルゴリズム]
---

## ひとことで

`TakeLast(count)` は、列の **末尾の `count` 個だけ** を返す関数です。
たとえば `1, 2, 3, 4, 5` に `TakeLast(2)` を使うと、`4, 5` が返ります。

前に説明した `SkipLast` と、同じ部品（`CountDown`）を使っています。違うのは、番号が付いた要素のうち、どちらを残すかだけです。

## コード

```csharp:line-numbers=52
        public static IEnumerable<TSource> TakeLast<TSource>(this IEnumerable<TSource> source, int count)
#endif
        {
            if (source == null) throw new ArgumentNullException(nameof(source));

            return count < 1 ? []
                 : source.CountDown(count, (e, cd) => (Element: e, Countdown: cd))
                         .SkipWhile(e => e.Countdown == null)
                         .Select(e => e.Element);
        }
```

## 前提知識

- **`CountDown`**: 末尾からの番号を、要素と一緒に付ける関数です。末尾が `0`、その前が `1` と数えます。番号が付かない要素には `null` が付きます。
- **`SkipWhile`**: 条件を満たす間は要素を捨て、条件を満たさなくなった後の要素を全部返す LINQ の関数です。
- **`Select`**: 要素を別の形に変える LINQ の関数です。
- **`count < 1 ? []`**: 1 より小さければ、空の列を返す書き方です。`[]` は空の配列を表す書き方です。
- **匿名の組（`(Element: e, Countdown: cd)`）**: 名前付きの組を、その場で作る書き方です。

## 何をしているか

### 1. 取り出す数が 1 未満なら、空の列を返す

```csharp:line-numbers=57
            return count < 1 ? []
```

`count` が 1 より小さければ、取り出すものがないので、空の列を返します。

### 2. 末尾からの番号を付ける

```csharp:line-numbers=58
                 : source.CountDown(count, (e, cd) => (Element: e, Countdown: cd))
```

`CountDown` で、各要素に末尾からの番号を付けます。番号と要素は、組にして扱います。

### 3. 番号が `null` の要素を飛ばす

```csharp:line-numbers=59
                         .SkipWhile(e => e.Countdown == null)
```

番号が `null` の要素は、末尾の `count` 個より前です。`SkipWhile` で、番号が `null` の間は捨てます。番号が付いた要素が出てきたら、そこからは全部残します。

### 4. 要素だけを取り出す

```csharp:line-numbers=60
                         .Select(e => e.Element);
```

組から要素だけを取り出して、結果とします。

## ここがすごい

- **`SkipLast` と対になる**: 同じ `CountDown` を使い、残す部分と捨てる部分を入れ替えただけです。
- **列の長さが分からなくても使える**: 全体を先に数えなくても、末尾の数個を取り出せます。
- **0 個なら何も読まない**: `count < 1` の場合は、列を読まずに空の列を返します。

## まとめ

- `TakeLast` は、末尾の `count` 個だけを返す。
- `CountDown` で末尾からの番号を付け、番号が付いた要素を残す。
- 取り出す数が 1 未満なら、空の列を返す。
