---
title: "指定した位置のビットが 1 かどうかを調べる"
description: ".NET Runtime の BitArray.Get。位置が範囲内かを確かめ、バイトの番号とバイト内の位置に分けて、その 1 ビットだけを取り出して判定する。"
language: csharp
project: ".NET Runtime"
repo: https://github.com/dotnet/runtime
license: MIT
copyright: "Copyright (c) .NET Foundation and Contributors"
commit: "f368d14df0c3905d3b80073d709685af83ba895d"
file: src/libraries/System.Private.CoreLib/src/System/Collections/BitArray.cs
lines: [388, 397]
function: "BitArray.Get(int)"
difficulty: 1
format: 2
tags: [ビット演算, データ構造, 防御的プログラミング]
---

## ひとことで

`BitArray.Get(index)` は、ビットの並びの中の **指定した位置が 1 かどうか** を返す関数です。
1 なら `true`、0 なら `false` を返します。

ビットは 8 個ずつバイトにまとめて保存されているので、目的のバイトを探してから、その中の 1 ビットを取り出します。

## コード

```csharp:line-numbers=388
        public bool Get(int index)
        {
            if ((uint)index >= (uint)_bitLength)
            {
                ThrowArgumentOutOfRangeException(index);
            }

            (uint byteIndex, uint bitOffset) = Math.DivRem((uint)index, BitsPerByte);
            return ((_array[byteIndex]) & (1 << (int)bitOffset)) != 0;
        }
```

## 前提知識

- **ビット配列**: 真偽値を 1 ビットずつ並べたものです。
- **`Math.DivRem`**: 割り算の商と余りを、同時に返す関数です。
- **ビット積（`&`）**: 両方のビットが 1 のときだけ 1 になる演算です。マスクと組み合わせて、1 ビットだけを取り出すのに使います。
- **`1 << n`**: `n` 番目のビットだけが 1 の値（マスク）を作ります。

## 何をしているか

### 1. 位置が範囲内か確かめる

```csharp:line-numbers=390
            if ((uint)index >= (uint)_bitLength)
            {
                ThrowArgumentOutOfRangeException(index);
            }
```

位置が 0 未満か、ビット数以上なら、範囲外の例外を投げます。

### 2. バイトの番号と、バイト内の位置を求める

```csharp:line-numbers=395
            (uint byteIndex, uint bitOffset) = Math.DivRem((uint)index, BitsPerByte);
```

位置をバイトの幅（8）で割って、バイトの番号と、バイト内の位置に分けます。

### 3. 該当のビットだけを取り出して判定する

```csharp:line-numbers=396
            return ((_array[byteIndex]) & (1 << (int)bitOffset)) != 0;
```

目的のバイトと、バイト内の位置に対応するマスクの AND を取ります。結果が 0 でなければ、そのビットは 1 です。

## ここがすごい

- **1 ビットだけを見る**: マスクで他のビットを消すので、ほかの位置の値が結果に混ざりません。
- **比較は 1 回**: 結果を 0 と比べるだけなので、分岐が少なく、速い判定です。
- **範囲外を先に弾く**: 不正な位置は、読む前に例外になるので、誤った場所を読むことがありません。

## まとめ

- 位置が範囲内か確かめる。
- 位置を、バイトの番号とバイト内の位置に分ける。
- マスクで該当の 1 ビットを取り出し、0 でなければ `true` を返す。
