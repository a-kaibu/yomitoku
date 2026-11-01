---
title: "列の要素数がちょうど指定の個数か確かめながら、配列に詰める"
description: "MoreLINQ の内部の補助関数 Fold。要素を指定の大きさの配列に詰めながら、多すぎても少なすぎても例外で知らせる。長さが決まっている入力を、安全に配列にするための処理。"
language: csharp
project: "MoreLINQ"
repo: https://github.com/morelinq/MoreLINQ
license: Apache-2.0
copyright: "Copyright (c) 2012 Atif Aziz. All rights reserved."
commit: "d217ab1e8eac68247650c27e977b767dd66bcab0"
file: MoreLinq/Fold.cs
lines: [25, 42]
function: "MoreEnumerable.Fold<T>(IEnumerable<T>, int)（内部の補助関数）"
difficulty: 2
format: 2
tags: [防御的プログラミング, エラー処理, データ構造]
---

## ひとことで

`Fold(source, count)` は、列の要素を **ちょうど `count` 個の配列** に詰める補助の関数です。
要素が `count` 個より多ければ例外を投げ、少なければ別の例外を投げます。ちょうど `count` 個のときだけ、配列を返します。

MoreLINQ の中で、長さが決まっている入力を扱うときに使われる、内部の部品です。

## コード

```csharp:line-numbers=25
        static T[] Fold<T>(this IEnumerable<T> source, int count)
        {
            var elements = new T[count];
            var i = 0;

            foreach (var item in source)
            {
                elements[i] = i < count ? item : throw LengthError(1);
                i++;
            }

            if (i < count)
                throw LengthError(-1);

            return elements;

            InvalidOperationException LengthError(int cmp) => new(FormatSequenceLengthErrorMessage(cmp, count));
        }
```

## 前提知識

- **固定長の配列**: 大きさを最初に決めて作る配列です。途中で大きさを変えられません。
- **`throw` 式**: `条件 ? 値 : throw 例外` のように、式の中で例外を投げる書き方です。
- **ローカル関数**: 関数の中に定義された、小さな関数です。ここでは、例外の作り方をまとめています。
- **`foreach`**: 列の要素を先頭から 1 つずつ取り出す書き方です。
- **例外（exception）**: 処理を続けられない異常を、呼び出し側へ知らせる仕組みです。

## 何をしているか

### 1. 配列を用意し、要素を詰める

```csharp:line-numbers=27
            var elements = new T[count];
            var i = 0;

            foreach (var item in source)
            {
                elements[i] = i < count ? item : throw LengthError(1);
                i++;
            }
```

`count` 個の大きさの配列を用意します。要素を 1 つずつ取り出して、配列の `i` 番目に入れます。`i` が `count` 以上になった（要素が多すぎる）場合は、`LengthError(1)` の例外を投げます。

### 2. 要素が足りなければ例外

```csharp:line-numbers=36
            if (i < count)
                throw LengthError(-1);
```

列の終わりに達したとき、`i` が `count` 未満なら、要素が足りないので `LengthError(-1)` を投げます。

### 3. ちょうどなら配列を返す

```csharp:line-numbers=39
            return elements;
```

ちょうど `count` 個だったときは、配列を返します。

### 4. 例外の作り方

```csharp:line-numbers=41
            InvalidOperationException LengthError(int cmp) => new(FormatSequenceLengthErrorMessage(cmp, count));
```

例外のメッセージは、比べた結果（多い・少ない）と個数から作ります。

## ここがすごい

- **早く気づける**: 多すぎる場合は、余分な要素を見つけた時点で例外になります。最後まで読む必要がありません。
- **型の安全性**: 配列の範囲を超える書き込みを、`i < count` の条件で防いでいます。
- **例外の中身を分けている**: 多すぎるか、足りないかをメッセージで区別できるので、原因が分かりやすくなります。
- **作る前の判定が不要**: 要素数を先に数えずに、1 回の走査で長さの確認と配列への格納を同時に行います。

## まとめ

- `Fold` は、列の要素をちょうど `count` 個の配列に詰める内部の補助関数である。
- 多すぎれば例外、少なければ別の例外で、原因を区別して知らせる。
- ちょうど `count` 個のときだけ配列を返し、1 回の走査で確認と格納を済ませる。
