---
title: "64 ビット同士の掛け算の上位と下位を、32 ビットずつに分けて求める"
description: ".NET Runtime の Math.BigMul(ulong, ulong, out ulong) の代替処理。64 ビットの数を上下 32 ビットに割り、4 回の掛け算と足し算で 128 ビットの積を求める。"
language: csharp
project: ".NET Runtime"
repo: https://github.com/dotnet/runtime
license: MIT
copyright: "Copyright (c) .NET Foundation and Contributors"
commit: "f368d14df0c3905d3b80073d709685af83ba895d"
file: src/libraries/System.Private.CoreLib/src/System/Math.cs
lines: [236, 247]
function: "Math.BigMul(ulong, ulong, out ulong)"
difficulty: 3
format: 2
tags: [ビット演算, 数値計算, 低レイヤ]
---

## ひとことで

`BigMul` は、64 ビットの数どうしを掛けたときの **128 ビットの積** を、上位の 64 ビットと下位の 64 ビットに分けて返す関数です。
通常の掛け算では、上位の部分が失われてしまうため、この関数が必要になります。

ここでは、CPU に専用の命令がない場合の計算方法を示しています。数を 32 ビットずつに分けて、小さな掛け算だけで組み立てます。

## コード

```csharp:line-numbers=236
                uint al = (uint)a;
                uint ah = (uint)(a >> 32);
                uint bl = (uint)b;
                uint bh = (uint)(b >> 32);

                ulong mull = ((ulong)al) * bl;
                ulong t = ((ulong)ah) * bl + (mull >> 32);
                ulong tl = ((ulong)al) * bh + (uint)t;

                low = tl << 32 | (uint)mull;

                return ((ulong)ah) * bh + (t >> 32) + (tl >> 32);
```

## 前提知識

- **溢れ（オーバーフロー）**: 64 ビットの掛け算の結果は、128 ビットになることがあります。そのうち、上位の 64 ビットが捨てられてしまいます。
- **32 ビットへの分割**: 64 ビットの数 `a` は、`ah * 2^32 + al` と書けます。`al` は下位の 32 ビット、`ah` は上位の 32 ビットです。
- **`>> 32` と `(uint)`**: 右に 32 ビットずらすと上位の部分が取り出せます。`(uint)` にキャストすると、下位の 32 ビットが取り出せます。
- **分配法則**: `(ah * 2^32 + al) * (bh * 2^32 + bl)` を展開すると、4 つの積の組み合わせになります。
- **`tl << 32 | (uint)mull`**: 上位の部分を左に 32 ビット動かし、下位の部分と組み合わせる書き方です。

## 何をしているか

### 1. 両方の数を上下 32 ビットに分ける

```csharp:line-numbers=236
                uint al = (uint)a;
                uint ah = (uint)(a >> 32);
                uint bl = (uint)b;
                uint bh = (uint)(b >> 32);
```

`a` と `b` を、それぞれ下位 32 ビット（`al`、`bl`）と上位 32 ビット（`ah`、`bh`）に分けます。

### 2. 下位どうしの積を求める

```csharp:line-numbers=241
                ulong mull = ((ulong)al) * bl;
```

`al * bl` は、32 ビット同士の積なので、64 ビットに収まります。この積は、結果の最も下の部分に関係します。

### 3. 中央の部分をまとめる

```csharp:line-numbers=242
                ulong t = ((ulong)ah) * bl + (mull >> 32);
                ulong tl = ((ulong)al) * bh + (uint)t;
```

`ah * bl` と `al * bh` は、結果の中央の部分になります。ここには、下位の積の上位 32 ビット（`mull >> 32`）も加えます。`t` と `tl` は、この中央の部分を、上下に分けて扱うための値です。

### 4. 下位 64 ビットを組み立てる

```csharp:line-numbers=245
                low = tl << 32 | (uint)mull;
```

`tl` の下位 32 ビットを上に動かし、`mull` の下位 32 ビットと組み合わせます。これで、結果の下位 64 ビットができます。

### 5. 上位 64 ビットを求める

```csharp:line-numbers=247
                return ((ulong)ah) * bh + (t >> 32) + (tl >> 32);
```

`ah * bh` に、`t` と `tl` から上に繰り上がる部分を足します。これで、結果の上位 64 ビットができます。

## ここがすごい

- **溢れる部分を先に取り出す**: 32 ビットに分けることで、途中の計算が 64 ビットに収まり、溢れずに済みます。
- **ハードウェアがなくても動く**: 専用の命令がない環境でも、四則演算だけで同じ結果が得られます。
- **数学的に正しい**: 分配法則を使って、4 つの積を正しく組み合わせています。この計算は、0 から `2^64 - 1` までのすべての組み合わせで、128 ビットの積と一致することを確かめられます。

## まとめ

- 64 ビットの数を、上下 32 ビットに分ける。
- 4 つの小さな積を、繰り上がりを含めて組み合わせる。
- 上位 64 ビットと下位 64 ビットを、それぞれ組み立てて返す。
