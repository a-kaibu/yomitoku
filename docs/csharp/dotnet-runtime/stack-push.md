---
title: "スタックの一番上に要素を積む"
description: ".NET Runtime の Stack<T>.Push。配列に空きがあれば、その場所に入れて要素数を増やし、空きがなければ配列を大きくする処理に任せる。"
language: csharp
project: ".NET Runtime"
repo: https://github.com/dotnet/runtime
license: MIT
copyright: "Copyright (c) .NET Foundation and Contributors"
commit: "f368d14df0c3905d3b80073d709685af83ba895d"
file: src/libraries/System.Collections/src/System/Collections/Generic/Stack.cs
lines: [266, 281]
function: "Stack<T>.Push(T)"
difficulty: 2
format: 2
tags: [データ構造, メモリ管理, 最適化]
---

## ひとことで

`Push` は、スタックの **一番上に要素を積む** 関数です。
配列に空きがあれば、そこに入れるだけで済みます。空きがなければ、配列を大きくしてから入れます。

後から積んだものが、次に取り出されます。

## コード

```csharp:line-numbers=266
        public void Push(T item)
        {
            int size = _size;
            T[] array = _array;

            if ((uint)size < (uint)array.Length)
            {
                array[size] = item;
                _version++;
                _size = size + 1;
            }
            else
            {
                PushWithResize(item);
            }
        }
```

## 前提知識

- **スタック**: 後から入れた要素が、先に取り出される入れ物です。
- **`_size`**: 今の要素数です。次に入れる場所の番号にもなります。
- **`_array`**: 要素を入れておく配列です。配列の長さは、要素数より大きいこともあります。
- **`(uint)size < (uint)array.Length`**: 配列に空きがあるかを、符号なしの 1 回の比較で調べる書き方です。
- **`_version`**: スタックが変わったことを数える番号です。列挙の途中で変更されたことを見つけるために使われます。
- **`PushWithResize`**: 配列を大きくしてから入れる、別の内部の関数です。ここでは詳しく扱いません。

## 何をしているか

### 1. 現在の状態を読む

```csharp:line-numbers=268
            int size = _size;
            T[] array = _array;
```

要素数と配列を、ローカル変数に取っておきます。

### 2. 空きがあるかを確かめる

```csharp:line-numbers=271
            if ((uint)size < (uint)array.Length)
```

`size` が配列の長さより小さければ、次の場所に空きがあります。

### 3. 空きがあれば、そこに入れる

```csharp:line-numbers=273
                array[size] = item;
                _version++;
                _size = size + 1;
```

要素を配列の `size` の位置に入れ、版の番号を進め、要素数を 1 増やします。配列を作り直さないので、速く終わります。

### 4. 空きがなければ、大きくしてから入れる

```csharp:line-numbers=277
            else
            {
                PushWithResize(item);
```

空きがなければ、`PushWithResize` に任せます。配列を大きくして、要素を入れる処理を行います。

## ここがすごい

- **普段は配列に入れるだけ**: 空きがあるときは、配列への代入と数の更新だけです。新しいメモリは確保しません。
- **大きくするのは必要なときだけ**: 配列を作り直すのは、空きがなくなったときだけです。何度も作り直さないので、平均すると速く積めます。
- **空きの判定が 1 回**: 符号なしの比較 1 回で、空きがあるかを判定しています。

## まとめ

- 配列に空きがあれば、そこに入れて要素数を増やす。
- 空きがなければ、配列を大きくする処理に任せる。
- 積んだ要素は、次の `Pop` や `TryPop` で最初に取り出される。
