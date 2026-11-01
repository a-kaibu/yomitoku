---
title: "「左にずらした分」と「あふれた分」を OR で戻す、ビットの回転"
description: "BitOperations.RotateLeft(uint) は、左シフトで押し出された上位ビットを右シフトで取り出し、OR で下位に戻す。32 ビットの回転を 1 行で書いている。"
language: csharp
project: ".NET Runtime"
repo: https://github.com/dotnet/runtime
license: MIT
copyright: "Copyright (c) .NET Foundation and Contributors"
commit: "f368d14df0c3905d3b80073d709685af83ba895d"
file: src/libraries/System.Private.CoreLib/src/System/Numerics/BitOperations.cs
lines: [672, 676]
function: "BitOperations.RotateLeft(uint, int)"
difficulty: 2
format: 2
tags: [ビット演算, 低レイヤ, ハック]
---

## ひとことで

`RotateLeft(value, offset)` は、32 ビットの値を **左に回転** させます。左にずらしたときに上からはみ出したビットを、そのまま右端に戻す操作です。
たとえば 8 ビットで `1000 0001` を 1 ビット左に回転すると、`0000 0011` になります。

普通のシフトだとはみ出したビットは消えてしまいますが、回転は情報を失いません。暗号や乱数、ハッシュの計算で広く使われます。

## コード

```csharp:line-numbers=672
        [Intrinsic]
        [MethodImpl(MethodImplOptions.AggressiveInlining)]
        [CLSCompliant(false)]
        public static uint RotateLeft(uint value, int offset)
            => (value << offset) | (value >> (32 - offset));
```

## 前提知識

- **左シフト `<<`**: ビット列を左にずらし、右端に 0 を入れます。上からはみ出したビットは消えます。
- **右シフト `>>`**: ビット列を右にずらし、左端に 0 を入れます。
- **`|`（OR）**: 桁ごとに「どちらかが 1 なら 1」にする演算です。2 つの値を重ねて合成するのに使います。
- **`[Intrinsic]`**: JIT が特別扱いする関数の印です。可能な CPU では、この関数の呼び出しが回転命令（ROL）1 つに置き換えられます。
- **`[CLSCompliant(false)]`**: 符号なし整数を使うため、符号なしを持たない言語からは使いにくいという印です。

## 何をしているか

`value = 0b1000_0001`（8 ビットの例）、`offset = 1` で追います。

### 1. 左にずらす

`value << 1` は各ビットを 1 つ左へずらします。`1000 0001` は `0000 0010` になり、最上位の 1 は押し出されて消えます。32 ビットでも同じで、最上位ビットが消えます。

### 2. はみ出したビットを取り出す

```csharp:line-numbers=676
            => (value << offset) | (value >> (32 - offset));
```

`value >> (32 - offset)` は、上位 `offset` ビットだけを右端に寄せます。`offset = 1` なら、最上位の 1 ビットが右端の位置に来ます。

### 3. OR で合成する

2 つの結果を `|` で合わせると、押し出されたビットが右端に戻ります。

```
value << 1          = 0000 0010
value >> (8 - 1)    = 0000 0001
OR                  = 0000 0011
```

## ここがすごい

- **1 行で完結する**: 回転は、シフト 2 回と OR 1 回で書けます。CPU に回転命令がなくても、この式でほぼ同じ結果になります。
- **`offset = 0` でも壊れない**: `value >> 32` は C# の仕様で「シフト量を 32 で割った余り（0）」になるため、結果は `value | value` で元の値に戻ります。ちゃんと動く式になっています。
- **JIT が 1 命令に変える**: `[Intrinsic]` と `AggressiveInlining` が付いているので、対応する CPU では `ROL` 命令 1 つになります。
- **64 ビット版も同じ形**: 同じファイルの `RotateLeft(ulong)` は 64 ビットで同じ式を使います。`uint` 版と並べると、ビット幅だけが違うことが分かります。

## まとめ

- 回転は「左シフトの結果」と「はみ出したビットを右から取り出した結果」を OR すると書ける。
- C# のシフト量は、ビット幅で割った余りとして扱われる。その性質を知っていると、境界の値も正しく扱える。
- 短い式でも、`Intrinsic` を付けると CPU 命令 1 つに置き換えられる。
