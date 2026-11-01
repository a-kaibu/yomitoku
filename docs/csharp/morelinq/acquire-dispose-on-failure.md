---
title: "使い捨ての資源をまとめて確保し、途中で失敗したら全部後片付けする"
description: "MoreLINQ の Acquire。IDisposable を持つ要素の列を配列にまとめて確保する。途中で例外が起きたら、それまでに集めたものをすべて Dispose してから例外を投げ直す。"
language: csharp
project: "MoreLINQ"
repo: https://github.com/morelinq/MoreLINQ
license: Apache-2.0
copyright: "Copyright (c) 2012 Atif Aziz. All rights reserved."
commit: "d217ab1e8eac68247650c27e977b767dd66bcab0"
file: MoreLinq/Acquire.cs
lines: [41, 58]
function: "MoreEnumerable.Acquire<TSource>(IEnumerable<TSource>)"
difficulty: 2
format: 2
tags: [メモリ管理, エラー処理, 防御的プログラミング]
---

## ひとことで

`Acquire` は、`IDisposable`（使い終わったら後片付けが必要な物）の列から、**全部を配列にまとめて確保** する関数です。
たとえば、ファイルや接続のような資源を、複数まとめて開いて持っておきたいときに使います。

途中で 1 つでも開けなかったら、それまでに開けた分をすべて閉じてから、例外を投げ直します。

## コード

```csharp:line-numbers=41
        public static TSource[] Acquire<TSource>(this IEnumerable<TSource> source)
            where TSource : IDisposable
        {
            if (source == null) throw new ArgumentNullException(nameof(source));

            var disposables = new List<TSource>();
            try
            {
                disposables.AddRange(source);
                return [..disposables];
            }
            catch
            {
                foreach (var disposable in disposables)
                    disposable.Dispose();
                throw;
            }
        }
```

## 前提知識

- **`IDisposable`**: `Dispose()` という後片付けの処理を持つ型です。ファイル、ストリーム、接続などが該当します。
- **`Dispose`**: 持っている資源（ファイルの読み書き先など）を解放する処理です。解放しないと、資源が残ったままになります。
- **`try` / `catch` / `throw`**: 例外が起きたときの処理を書くための仕組みです。`throw;` は、例外をそのまま投げ直します。
- **`List<T>.AddRange`**: 列の要素を、リストの末尾にまとめて追加します。
- **コレクション式 `[..disposables]`**: リストの中身を展開して、新しい配列を作る書き方です。

## 何をしているか

### 1. 集めながら、リストに入れる

```csharp:line-numbers=46
            var disposables = new List<TSource>();
            try
            {
                disposables.AddRange(source);
```

空のリストを用意し、列の要素をまとめて追加します。途中で例外が起きると、`catch` へ進みます。

### 2. 成功したら配列にして返す

```csharp:line-numbers=50
                return [..disposables];
```

リストの中身を配列にして返します。

### 3. 失敗したら、集めた分を全部閉じる

```csharp:line-numbers=52
            catch
            {
                foreach (var disposable in disposables)
                    disposable.Dispose();
                throw;
```

`catch` では、それまでに集めた要素を 1 つずつ `Dispose` します。そのあと `throw;` で、元の例外をそのまま投げ直します。

## ここがすごい

- **半分だけ開いたまま残らない**: 途中で失敗しても、開けた分は必ず閉じるので、資源が漏れません。
- **例外は元のまま**: `throw;` で投げ直すので、呼び出し側は本来の原因を見られます。
- **型の制約で安全**: `where TSource : IDisposable` により、後片付けできない型は受け付けません。
- **結果は配列**: 確保が完了したら、大きさが決まった配列として返すので、後から扱いやすくなります。

## まとめ

- `Acquire` は、`IDisposable` の列を配列にまとめて確保する。
- 途中で例外が起きたら、集めた分を全部 `Dispose` してから、例外を投げ直す。
- 資源を半端に開いたまま残さないための、防御的な作りになっている。
