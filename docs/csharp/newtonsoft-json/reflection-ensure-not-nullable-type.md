---
title: "Nullable 型なら、中身の型を取り出す"
description: "Newtonsoft.Json の ReflectionUtils.EnsureNotNullableType。Nullable<T> の型なら中の T を返し、それ以外はそのまま返す。型情報を扱う前の正規化に使う。"
language: csharp
project: "Newtonsoft.Json"
repo: https://github.com/JamesNK/Newtonsoft.Json
license: MIT
copyright: "Copyright (c) 2007 James Newton-King"
commit: "52fa3aef1f2cadcd3a3f874251eddc98d3efbbaa"
file: Src/Newtonsoft.Json/Utilities/ReflectionUtils.cs
lines: [288, 293]
function: "ReflectionUtils.EnsureNotNullableType(Type)"
difficulty: 2
format: 2
tags: [リフレクション, 型システム, ジェネリクス]
---

## ひとことで

`EnsureNotNullableType` は、型が `Nullable<T>`（値が無いかもしれない値型）だったら、中の型 `T` を返す関数です。
たとえば `int?` を渡すと `int` が返り、`string` は `string` のまま返ります。

型を調べて処理を決めるとき、`null` を許す外側の型を外して、中身の型で比べるために使われます。

## コード

```csharp:line-numbers=288
        public static Type EnsureNotNullableType(Type t)
        {
            return (IsNullableType(t))
                ? Nullable.GetUnderlyingType(t)!
                : t;
        }
```

## 前提知識

- **`Type`**: 型そのものを表すオブジェクトです。リフレクション（実行中に型の情報を調べる仕組み）で使われます。
- **`Nullable<T>`**: 値型に、`null`（値がないこと）を許すための型です。`int?` は `Nullable<int>` と同じ意味です。
- **ジェネリック型定義**: `Nullable<>` のように、型の引数を空けた型です。`GetGenericTypeDefinition()` で、その形を取り出せます。
- **`Nullable.GetUnderlyingType`**: `Nullable<T>` の中の `T` を返す .NET の関数です。`Nullable<T>` でなければ `null` を返します。
- **三項演算子 `?:`**: 条件によって、2 つのうち 1 つを選ぶ書き方です。

## 何をしているか

### 1. Nullable 型かどうかを調べる

```csharp:line-numbers=281
        public static bool IsNullableType(Type t)
        {
            ValidationUtils.ArgumentNotNull(t, nameof(t));

            return (t.IsGenericType() && t.GetGenericTypeDefinition() == typeof(Nullable<>));
        }
```

`IsNullableType` は、型がジェネリック型で、その定義が `Nullable<>` と同じかを調べます。`int?` はこれに当てはまります。

### 2. Nullable 型なら、中の型を返す

```csharp:line-numbers=290
            return (IsNullableType(t))
                ? Nullable.GetUnderlyingType(t)!
```

`Nullable` の型なら、`GetUnderlyingType` で中の型（`int?` なら `int`）を取り出します。`!` は、ここでは `null` にならないと判断している印です。

### 3. それ以外は、そのまま返す

```csharp:line-numbers=292
                : t;
```

`Nullable` でない型は、何もせずに返します。

## ここがすごい

- **呼び出し側が簡単になる**: `int?` と `int` を同じ扱いで比べられるように、1 つの関数で正規化しています。
- **何もしない場合が速い**: `Nullable` でなければ、型を変えずに返すだけです。
- **型の判定を 1 か所に集める**: `IsNullableType` を使うことで、判定の仕方を 1 か所にまとめています。

## まとめ

- `Nullable<T>` なら、中の `T` を返す。
- それ以外は、渡された型をそのまま返す。
- 型を比べる前に、`null` を許す外側の型を外す。
