---
title: "列を最後まで読み、結果を捨てて処理だけを実行させる"
description: "MoreLINQ の Consume。遅延評価の列を、要素を捨てながら最後まで読む。途中の処理（副作用）だけを実行させたいときに使う。"
language: csharp
project: "MoreLINQ"
repo: https://github.com/morelinq/MoreLINQ
license: Apache-2.0
copyright: "Copyright (c) 2012 Atif Aziz. All rights reserved."
commit: "d217ab1e8eac68247650c27e977b767dd66bcab0"
file: MoreLinq/Consume.cs
lines: [32, 38]
function: "MoreEnumerable.Consume<T>(IEnumerable<T>)"
difficulty: 1
format: 2
tags: [遅延評価, イディオム, イテレータ]
---

## ひとことで

`Consume()` は、列を **最後まで読み、各要素を捨てる** 関数です。
結果の値は使わず、列を読むことによって起きる処理（画面への出力やログの記録など）だけを実行させたいときに使います。

遅延評価の列は、読まれるまで何も実行されません。`Consume` は、その読み出しを強制するための道具です。

## コード

```csharp:line-numbers=32
        public static void Consume<T>(this IEnumerable<T> source)
        {
            if (source == null) throw new ArgumentNullException(nameof(source));
            foreach (var _ in source)
            {
            }
        }
```

## 前提知識

- **遅延評価**: 列を作っても、要素を読まなければ、途中の処理は実行されない仕組みです。
- **`foreach`**: 列の要素を先頭から順に取り出す繰り返しです。
- **`_`（捨て変数）**: 値を使わないことを示す名前です。ここでは、要素を受け取るだけで捨てています。
- **副作用**: 値を返す以外に、画面への出力や、状態の変更などを起こす処理のことです。

## 何をしているか

### 1. `null` を弾く

```csharp:line-numbers=34
            if (source == null) throw new ArgumentNullException(nameof(source));
```

列が `null` なら、例外を投げます。

### 2. 要素を順に読んで、捨てる

```csharp:line-numbers=35
            foreach (var _ in source)
            {
            }
```

`foreach` で最後まで読みます。本体は空なので、各要素は何にも使われず、捨てられます。読むこと自体が、途中の処理を実行させます。

## ここがすごい

- **読むことだけを目的にできる**: 結果を配列に詰める必要がないので、大きな列でもメモリを使いません。
- **意図が明確**: 「値は不要で、処理だけがほしい」という意図を、関数名で示せます。
- **短く書ける**: 本体が空の `foreach` 1 つで済みます。

## まとめ

- `null` は例外にする。
- 列を先頭から最後まで読み、要素は捨てる。
- 読み出しによって、途中の処理だけが実行される。
