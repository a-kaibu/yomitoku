---
title: "変換と絞り込みを 1 回で行い、使える結果だけを返す"
description: "MoreLINQ の Choose。各要素を変換する関数が「値があるかどうか」と「値」を組で返し、値がある要素だけを列に残す。Where と Select を 1 回にまとめたような処理。"
language: csharp
project: "MoreLINQ"
repo: https://github.com/morelinq/MoreLINQ
license: Apache-2.0
copyright: "Copyright (c) 2012 Atif Aziz. All rights reserved."
commit: "d217ab1e8eac68247650c27e977b767dd66bcab0"
file: MoreLinq/Choose.cs
lines: [52, 70]
function: "MoreEnumerable.Choose<T, TResult>(IEnumerable<T>, Func<T, (bool, TResult)>)"
difficulty: 2
format: 2
tags: [イテレータ, 遅延評価, 関数型]
---

## ひとことで

`Choose(chooser)` は、列の各要素を **変換しつつ、使えるものだけを残す** 関数です。
変換の関数は、「値があるか（`true` / `false`）」と「値」を組にして返します。`false` の要素は捨てられ、`true` の要素だけが結果に入ります。

たとえば文字列の `"1"`, `"x"`, `"3"` を整数に変換するとき、数字として読めたものだけを残せば、`1` と `3` が得られます。

## コード

```csharp:line-numbers=52
        public static IEnumerable<TResult> Choose<T, TResult>(this IEnumerable<T> source,
            Func<T, (bool, TResult)> chooser)
        {
            if (source == null) throw new ArgumentNullException(nameof(source));
            if (chooser == null) throw new ArgumentNullException(nameof(chooser));

            return _(source, chooser);

            static IEnumerable<TResult> _(
                IEnumerable<T> source,
                Func<T, (bool, TResult)> chooser)
            {
                foreach (var item in source)
                {
                    var (some, value) = chooser(item);
                    if (some)
                        yield return value;
                }
            }
```

## 前提知識

- **`Where`（絞り込み）と `Select`（変換）**: LINQ の基本の 2 つの関数です。`Where` は条件に合うものを残し、`Select` は各要素を別の値に変えます。
- **タプル `(bool, TResult)`**: 2 つの値を 1 つにまとめた組です。ここでは「値があるか」と「値」を一緒に返すために使います。
- **分解代入 `var (some, value) = ...`**: タプルを、2 つの変数に分けて受け取る書き方です。
- **`yield return`**: 結果を 1 つずつ返す書き方です。
- **`int.TryParse` のような関数**: 変換に失敗したとき `false` を返し、例外を出さずに判定できる関数の型です。

## 何をしているか

### 1. 要素を変換し、結果の組を受け取る

```csharp:line-numbers=64
                foreach (var item in source)
                {
                    var (some, value) = chooser(item);
```

列の要素を 1 つずつ取り出し、`chooser` に渡します。返ってきた組を、`some`（値があるか）と `value` に分けて受け取ります。

### 2. 値があるものだけを返す

```csharp:line-numbers=67
                    if (some)
                        yield return value;
```

`some` が `true` のときだけ、`value` を `yield return` します。`false` の要素は、何も返さずに次へ進みます。

### 具体例で確かめる

`"1"`, `"x"`, `"3"` を整数にする `chooser` は、次のように動きます。

```
"1" → (true, 1)   → 1 を返す
"x" → (false, 0)  → 捨てる
"3" → (true, 3)   → 3 を返す
結果: 1, 3
```

## ここがすごい

- **1 回の走査で 2 つの仕事をする**: 絞り込みと変換を、列を読む 1 回で済ませます。`Where` と `Select` を別々に書くより、読む回数が減ります。
- **例外を使わない**: 変換できないものを、例外で弾かずに `false` で扱うので、処理が軽くなります。
- **型が安全**: 「値があるか」を型の中に含めるので、値のない要素を誤って使うことがありません。
- **遅延して返す**: 結果は要求されたときに 1 つずつ作られます。

## まとめ

- `Choose` は、変換の関数が返す「値があるか」を見て、使える結果だけを返す。
- 絞り込みと変換を 1 回の走査で行うので、読む回数が少なくなる。
- 変換に失敗するものは例外にせず、`false` で静かに捨てられる。
