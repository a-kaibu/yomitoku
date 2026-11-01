---
title: "指定した位置のビットを、1 か 0 に書き換える"
description: ".NET Runtime の BitArray.Set。位置をバイトの番号とバイト内の位置に分け、その位置だけを立てるか消すマスクで書き換える。版番号も進める。"
language: csharp
project: ".NET Runtime"
repo: https://github.com/dotnet/runtime
license: MIT
copyright: "Copyright (c) .NET Foundation and Contributors"
commit: "f368d14df0c3905d3b80073d709685af83ba895d"
file: src/libraries/System.Private.CoreLib/src/System/Collections/BitArray.cs
lines: [407, 428]
function: "BitArray.Set(int, bool)"
difficulty: 2
format: 2
tags: [ビット演算, データ構造, 防御的プログラミング]
---

## ひとことで

`BitArray.Set(index, value)` は、ビットの並びの中の **指定した位置を 1（`true`）か 0（`false`）にする** 関数です。
たとえば、位置 10 のビットを `true` にすると、そのビットだけが 1 になり、ほかのビットは変わりません。

ビットは 8 個ずつバイトにまとめて保存されています。この関数は、目的のバイトを探してから、そのバイトの中の 1 ビットだけを書き換えます。

## コード

```csharp:line-numbers=407
        public void Set(int index, bool value)
        {
            if ((uint)index >= (uint)_bitLength)
            {
                ThrowArgumentOutOfRangeException(index);
            }

            (uint byteIndex, uint bitOffset) = Math.DivRem((uint)index, BitsPerByte);

            ref byte segment = ref _array[byteIndex];
            byte bitMask = (byte)(1 << (int)bitOffset);
            if (value)
            {
                segment |= bitMask;
            }
            else
            {
                segment &= (byte)~bitMask;
            }

            _version++;
        }
```

## 前提知識

- **ビット配列**: 真偽値を 1 ビットずつ並べたものです。メモリを節約できます。
- **`Math.DivRem`**: 割り算の商と余りを、同時に返す関数です。ここでは、バイトの番号と、バイト内の位置を求めます。
- **マスク**: 特定のビットだけを取り出したり、変えたりするための値です。`1 << n` は、`n` 番目のビットだけが 1 のマスクになります。
- **`|=` と `&=`**: `|=` は、指定のビットを立てる（OR）書き方です。`&=` は、ビットを消す（AND）書き方です。
- **`~`**: ビットを反転します。`~bitMask` は、そのビットだけが 0 で、ほかが 1 のマスクになります。

## 何をしているか

### 1. 位置が範囲内か確かめる

```csharp:line-numbers=409
            if ((uint)index >= (uint)_bitLength)
            {
                ThrowArgumentOutOfRangeException(index);
            }
```

位置が 0 未満か、ビットの数以上なら、範囲外の例外を投げます。

### 2. バイトの番号と、バイト内の位置を求める

```csharp:line-numbers=414
            (uint byteIndex, uint bitOffset) = Math.DivRem((uint)index, BitsPerByte);
```

位置をバイトの幅（8）で割って、バイトの番号（商）と、バイト内の位置（余り）に分けます。

### 3. 目的のバイトと、ビットのマスクを用意する

```csharp:line-numbers=416
            ref byte segment = ref _array[byteIndex];
            byte bitMask = (byte)(1 << (int)bitOffset);
```

目的のバイトを参照で取り出し、バイト内の位置に対応するマスクを作ります。

### 4. ビットを立てるか消す

```csharp:line-numbers=418
            if (value)
            {
                segment |= bitMask;
            }
            else
            {
                segment &= (byte)~bitMask;
            }
```

`value` が `true` なら、マスクの位置を OR で立てます。`false` なら、マスクを反転した値との AND で、その位置だけを 0 にします。ほかのビットはそのまま残ります。

### 5. 版番号を進める

```csharp:line-numbers=427
            _version++;
```

列挙の途中で内容が変わったことを示すため、版番号を 1 増やします。

## ここがすごい

- **ほかのビットを壊さない**: マスクを使うことで、変えたいビット 1 つだけを書き換えられます。
- **分岐は 1 か所**: 立てるか消すかの違いだけを `if` で分けています。
- **参照で直接書く**: バイトを参照で取り出すので、配列全体をコピーせずに、その場で書き換えます。

## まとめ

- 位置を、バイトの番号とバイト内の位置に分ける。
- マスクで、その 1 ビットだけを、OR で立てるか、AND で消す。
- ほかのビットは変えず、版番号を進める。
