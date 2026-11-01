---
title: "範囲（Range）を、開始位置と長さに直し、範囲外なら例外にする"
description: ".NET Runtime の Range.GetOffsetAndLength。開始と終了の位置を番号に直し、列の長さに収まり、開始が終了より後ろでないかを確かめてから、開始と長さを返す。"
language: csharp
project: ".NET Runtime"
repo: https://github.com/dotnet/runtime
license: MIT
copyright: "Copyright (c) .NET Foundation and Contributors"
commit: "f368d14df0c3905d3b80073d709685af83ba895d"
file: src/libraries/System.Private.CoreLib/src/System/Range.cs
lines: [116, 127]
function: "Range.GetOffsetAndLength(int)"
difficulty: 2
format: 2
tags: [防御的プログラミング, 型システム, エラー処理]
---

## ひとことで

`Range` は、列の一部分を表す型です。`1..3` のように、開始と終了の位置を持ちます。
`GetOffsetAndLength(length)` は、その範囲を、**開始の番号と長さ** に直して返します。範囲が列の外に出ていれば、例外を投げます。

たとえば長さ 5 の列で `1..^1` は、開始 `1` と長さ `3` になります。

## コード

```csharp:line-numbers=116
        public (int Offset, int Length) GetOffsetAndLength(int length)
        {
            int start = Start.GetOffset(length);
            int end = End.GetOffset(length);

            if ((uint)end > (uint)length || (uint)start > (uint)end)
            {
                ThrowArgumentOutOfRangeException();
            }

            return (start, end - start);
        }
```

## 前提知識

- **`Range`**: 開始と終了の `Index` の組です。終了の位置は、その番号の手前までを含みます（終了は含みません）。
- **`Index.GetOffset`**: `Index` を、列の長さを使って先頭からの番号に直す関数です。
- **`(int Offset, int Length)`**: 2 つの値をまとめて返す、名前付きの組です。
- **`(uint)` へのキャスト**: 負の数を、非常に大きな正の数として比べられるようにする書き方です。1 回の比較で、負の範囲も外れと判定できます。
- **範囲外の例外**: 範囲が列の外にあるときに投げられる `ArgumentOutOfRangeException` です。

## 何をしているか

### 1. 開始と終了を番号に直す

```csharp:line-numbers=118
            int start = Start.GetOffset(length);
            int end = End.GetOffset(length);
```

`Start` と `End` を、それぞれ `GetOffset` で番号に直します。`^` の付いた位置は、ここで長さを使って変換されます。

### 2. 範囲が列の中に収まるかを調べる

```csharp:line-numbers=121
            if ((uint)end > (uint)length || (uint)start > (uint)end)
```

終了の番号が長さより大きい、または開始の番号が終了より大きいと、範囲が成立しません。`uint` に直して比べることで、負の番号も同時に外れと判定できます。

### 3. 範囲外なら例外を投げる

```csharp:line-numbers=123
                ThrowArgumentOutOfRangeException();
```

条件に当てはまったら、例外を投げます。

### 4. 開始と長さを返す

```csharp:line-numbers=126
            return (start, end - start);
```

開始の番号と、終了から開始を引いた長さを返します。

## ここがすごい

- **変換と検査を 1 か所に集める**: 位置の変換と範囲の確認を、同じ関数で行うので、呼び出し側は 1 回呼ぶだけで済みます。
- **負の値も 1 回の比較で外す**: `uint` への変換で、負の番号を大きな値として扱えるので、条件式が短く済みます。
- **結果が使いやすい形**: 開始と長さで返すので、部分列の取り出しにそのまま使えます。

## まとめ

- 開始と終了の位置を、長さを使って番号に直す。
- 終了が長さを超えるか、開始が終了より後ろなら例外にする。
- 範囲が正しければ、開始と長さを返す。
