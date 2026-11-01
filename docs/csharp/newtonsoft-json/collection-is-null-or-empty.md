---
title: "コレクションが null か、要素が 0 個かを 1 つの判定にまとめる"
description: "Newtonsoft.Json の CollectionUtils.IsNullOrEmpty。コレクションが null なら空とみなし、そうでなければ Count が 0 かを調べる。"
language: csharp
project: "Newtonsoft.Json"
repo: https://github.com/JamesNK/Newtonsoft.Json
license: MIT
copyright: "Copyright (c) 2007 James Newton-King"
commit: "52fa3aef1f2cadcd3a3f874251eddc98d3efbbaa"
file: Src/Newtonsoft.Json/Utilities/CollectionUtils.cs
lines: [56, 63]
function: "CollectionUtils.IsNullOrEmpty<T>(ICollection<T>)"
difficulty: 1
format: 2
tags: [防御的プログラミング, 型システム, ジェネリクス]
---

## ひとことで

`IsNullOrEmpty` は、コレクションが **`null` か、要素が 1 つもないか** を調べる関数です。
どちらか一方でも当てはまれば `true` を返します。

「空かどうか」を、呼び出す側が毎回 `null` と個数の 2 つを確かめなくて済むように、1 つにまとめています。

## コード

```csharp:line-numbers=56
        public static bool IsNullOrEmpty<T>(ICollection<T> collection)
        {
            if (collection != null)
            {
                return (collection.Count == 0);
            }
            return true;
        }
```

## 前提知識

- **`ICollection<T>`**: 要素数（`Count`）を持つコレクションの約束（インターフェース）です。
- **`null`**: 値がないことを表す特別な参照です。`null` のコレクションに `Count` を読むと、例外になります。
- **ジェネリクス `<T>`**: どんな要素の型でも使えるように、型を後から決める書き方です。

## 何をしているか

### 1. `null` でなければ、個数を調べる

```csharp:line-numbers=58
            if (collection != null)
            {
                return (collection.Count == 0);
```

コレクションが `null` でなければ、`Count` が 0 かを調べて、その結果を返します。

### 2. `null` なら空とみなす

```csharp:line-numbers=62
            return true;
```

`null` のコレクションは、要素がないものとして `true` を返します。

## ここがすごい

- **`null` を先に確かめる**: `null` の場合は `Count` を読まないので、例外になりません。
- **呼び出し側が簡単になる**: 「`null` か空か」を 1 行で判定できます。
- **比べるだけ**: 要素を読まずに、個数だけを見るので速いです。

## まとめ

- `null` でなければ、個数が 0 かを返す。
- `null` は空とみなして `true` を返す。
