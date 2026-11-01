---
title: "同じ 16 バイトを、Guid と 1 バイトずつの見方の両方で読む"
description: "MessagePack の GuidBits 構造体。StructLayout の FieldOffset で、Guid と Byte0 から Byte15 を同じ位置に重ねる。値をコピーせずに、バイトを直接読める。"
language: csharp
project: "MessagePack for C#"
repo: https://github.com/MessagePack-CSharp/MessagePack-CSharp
license: MIT
copyright: "Copyright (c) 2017 Yoshifumi Kawai and contributors"
commit: "9bc353141d0a280b6a470f1db29d3e0790cbb8b4"
file: src/MessagePack/Internal/GuidBits.cs
lines: [9, 46]
function: "GuidBits"
difficulty: 2
format: 2
tags: [低レイヤ, 型システム, メモリ管理]
---

## ひとことで

`GuidBits` は、**1 つの 16 バイトの領域を、2 通りの見方で同時に使う** 構造体です。
一方は `Guid` としての見方、もう一方は `Byte0` から `Byte15` までの、1 バイトずつの見方です。

2 つの見方は、同じメモリの場所を指しています。そのため、`Guid` を変換せずに、バイトを 1 つずつ読めます。

## コード

```csharp:line-numbers=9
    [StructLayout(LayoutKind.Explicit, Pack = 1)]
    internal struct GuidBits
    {
        [FieldOffset(0)]
        public readonly Guid Value;

        [FieldOffset(0)]
        public readonly byte Byte0;
        [FieldOffset(1)]
        public readonly byte Byte1;
        [FieldOffset(2)]
        public readonly byte Byte2;
        [FieldOffset(3)]
        public readonly byte Byte3;
        [FieldOffset(4)]
        public readonly byte Byte4;
        [FieldOffset(5)]
        public readonly byte Byte5;
        [FieldOffset(6)]
        public readonly byte Byte6;
        [FieldOffset(7)]
        public readonly byte Byte7;
        [FieldOffset(8)]
        public readonly byte Byte8;
        [FieldOffset(9)]
        public readonly byte Byte9;
        [FieldOffset(10)]
        public readonly byte Byte10;
        [FieldOffset(11)]
        public readonly byte Byte11;
        [FieldOffset(12)]
        public readonly byte Byte12;
        [FieldOffset(13)]
        public readonly byte Byte13;
        [FieldOffset(14)]
        public readonly byte Byte14;
        [FieldOffset(15)]
        public readonly byte Byte15;
```

## 前提知識

- **構造体（`struct`）**: 値を持つ型です。代入するとき、中身がコピーされます。
- **`StructLayout(LayoutKind.Explicit)`**: 構造体の中のフィールドの位置を、自分で決める指定です。
- **`FieldOffset`**: フィールドが、構造体の先頭から何バイト目に置かれるかを表します。
- **`Pack = 1`**: フィールドを詰めて並べる指定です。途中にすき間を入れないことを表します。
- **`Guid`**: 16 バイトの識別子を表す .NET の型です。

## 何をしているか

### 1. 構造体のレイアウトを明示する

```csharp:line-numbers=9
    [StructLayout(LayoutKind.Explicit, Pack = 1)]
    internal struct GuidBits
    {
```

`Explicit` と `Pack = 1` を指定して、フィールドの位置を自分で決められるようにします。

### 2. `Guid` を先頭（オフセット 0）に置く

```csharp:line-numbers=12
        [FieldOffset(0)]
        public readonly Guid Value;
```

`Value` は、オフセット 0 から 16 バイトを占めます。これで、`Guid` としての値が、この領域に入ります。

### 3. 各バイトを、同じ先頭から重ねる

```csharp:line-numbers=15
        [FieldOffset(0)]
        public readonly byte Byte0;
```

`Byte0` も、オフセット 0 に置かれています。つまり、`Value` の最初のバイトと同じ場所です。`Byte1` から `Byte15` も、同じように 1 バイトずつずれて重なります。

### 4. 最後のバイトまで重なっている

```csharp:line-numbers=45
        [FieldOffset(15)]
        public readonly byte Byte15;
```

`Byte15` は、オフセット 15 にあります。16 バイトの領域の最後と、ぴったり一致します。

## ここがすごい

- **変換せずに読める**: `Guid` を `ToByteArray` で配列に変えなくても、1 バイトずつ直接読めます。
- **コピーが少ない**: 同じ領域を重ねて使うので、バイトの配列を作り直す必要がありません。
- **ネットワークやファイルの処理に向く**: 16 バイトの ID を、バイト単位で読み書きする場面で役立ちます。

## まとめ

- `Explicit` のレイアウトで、フィールドを同じ位置に重ねる。
- `Guid` と `Byte0` から `Byte15` が、同じ 16 バイトを指す。
- 変換せずに、バイト単位で読み書きできる。
