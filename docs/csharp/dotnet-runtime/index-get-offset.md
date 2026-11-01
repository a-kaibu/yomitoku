---
title: "末尾からの位置（^n）を、先頭からの番号に直す"
description: ".NET Runtime の Index.GetOffset。Index は内部で値をビット反転して末尾からの指定を表す。その値を、長さを使って先頭からの番号に変換する。"
language: csharp
project: ".NET Runtime"
repo: https://github.com/dotnet/runtime
license: MIT
copyright: "Copyright (c) .NET Foundation and Contributors"
commit: "f368d14df0c3905d3b80073d709685af83ba895d"
file: src/libraries/System.Private.CoreLib/src/System/Index.cs
lines: [109, 121]
function: "Index.GetOffset(int)"
difficulty: 3
format: 2
tags: [ビット演算, 型システム, 数値計算]
---

## ひとことで

`Index` は、列の位置を表す型です。`^1` のように、**末尾から数えた位置** も表せます。
`GetOffset(length)` は、その位置を、列の長さを使って **先頭から数えた番号** に直す関数です。
たとえば、長さ 5 の列で `^1` は、番号 `4` になります。

## コード

::: code-group

```csharp:line-numbers=109 [日本語訳]
        public int GetOffset(int length)
        {
            int offset = _value;
            if (IsFromEnd)
            {
                // 式を変形すると、次のようになる。
                // offset = length + (~(~value) + 1)
                // offset = length + value + 1

                offset += length + 1;
            }
            return offset;
        }
```

```csharp:line-numbers=109 [原文]
        public int GetOffset(int length)
        {
            int offset = _value;
            if (IsFromEnd)
            {
                // offset = length - (~value)
                // offset = length + (~(~value) + 1)
                // offset = length + value + 1

                offset += length + 1;
            }
            return offset;
        }
```

:::

## 前提知識

- **`Index`**: 位置を表す構造体です。先頭からの位置は、番号をそのまま入れます。末尾からの位置は、`^` を付けて表します。
- **ビット反転（`~`）**: すべてのビットを反対にする演算です。`~n` は `-n - 1` と同じ値になります。
- **`IsFromEnd`**: 末尾からの位置かどうかを表す値です。
- **`length`**: 列の長さです。
- **`^n` の内部の表現**: 末尾からの `n` は、内部では `~n` として保存されています。負の値になるので、先頭からの位置と区別できます。

## 何をしているか

### 1. 保存されている値を取り出す

```csharp:line-numbers=111
            int offset = _value;
```

内部の値（`_value`）を `offset` に入れます。先頭からの位置なら、この値がそのまま番号になります。

### 2. 末尾からの位置なら、長さを使って変換する

```csharp:line-numbers=112
            if (IsFromEnd)
            {
                // 式を変形すると、次のようになる。
                // offset = length + (~(~value) + 1)
                // offset = length + value + 1

                offset += length + 1;
            }
```

末尾からの位置のとき、内部の値は `~n` です。式を変形すると、`length + value + 1` になります。`value` は `~n` なので、結果は `length - n` になります。長さ 5 の `^1` なら、`5 - 1 = 4` です。

### 3. 番号を返す

```csharp:line-numbers=120
            return offset;
```

求めた番号を返します。先頭からの位置なら、そのままの番号です。

## ここがすごい

- **1 つの値で 2 通りを表す**: 負の値を末尾からの位置に使うことで、番号と同じ型のまま、2 種類の位置を区別しています。
- **計算が足し算だけ**: 変換は `length + value + 1` の足し算で済みます。
- **範囲外は呼び出し側で検査**: 結果が負になる場合は、この関数では検査せず、配列などのアクセスで例外になります。

## まとめ

- 末尾からの位置は、内部でビット反転された値として保存されている。
- 長さに足し算をすると、先頭からの番号になる。
- 先頭からの位置は、そのまま番号として返す。
