---
title: "バイト列の先頭から、整数を境界を気にせず読み取る"
description: "MessagePack-CSharp の SafeBitConverter。バイト列の先頭から 8 バイトや 2 バイトを、そのまま整数として読む。整列されていない位置でも読めるよう、Unsafe.ReadUnaligned を使う。"
language: csharp
project: "MessagePack for C#"
repo: https://github.com/MessagePack-CSharp/MessagePack-CSharp
license: MIT
copyright: "Copyright (c) 2017 Yoshifumi Kawai and contributors"
commit: "9bc353141d0a280b6a470f1db29d3e0790cbb8b4"
file: src/MessagePack/SafeBitConverter.cs
lines: [12, 21]
function: "SafeBitConverter.ToInt64 / ToUInt64 / ToUInt16 / ToUInt32"
difficulty: 3
format: 2
tags: [入出力, 低レイヤ, 移植性]
---

## ひとことで

`SafeBitConverter` は、バイト列の一部分を **そのまま整数として読み取る** 小さな関数群です。
たとえば、先頭の 8 バイトを `long` として読みます。MessagePack のデータを解析するときに、数値を取り出すために使います。

名前に `Safe` とありますが、ここでは **長さの確認をしない** 点に注意が必要です。読む前に、呼び出し側で長さを確かめておく前提になっています。

## コード

```csharp:line-numbers=12
    internal static long ToInt64(ReadOnlySpan<byte> value)
        => Unsafe.ReadUnaligned<long>(ref Unsafe.AsRef(in MemoryMarshal.GetReference(value)));

    internal static ulong ToUInt64(ReadOnlySpan<byte> value) => unchecked((ulong)ToInt64(value));

    internal static unsafe ushort ToUInt16(ReadOnlySpan<byte> value)
        => Unsafe.ReadUnaligned<ushort>(ref Unsafe.AsRef(in MemoryMarshal.GetReference(value)));

    internal static unsafe uint ToUInt32(ReadOnlySpan<byte> value)
        => Unsafe.ReadUnaligned<uint>(ref Unsafe.AsRef(in MemoryMarshal.GetReference(value)));
```

## 前提知識

- **バイト列（`ReadOnlySpan<byte>`）**: 読み取り専用で、連続したバイトの一部を指す型です。
- **整列（アライメント）**: 数値を置くメモリの位置が、型の大きさに合っていることです。整列されていない位置から読むと、遅くなったり、一部の環境で失敗したりします。
- **`Unsafe.ReadUnaligned<T>`**: 整列されていない位置から、型 `T` の値を読む命令です。
- **`MemoryMarshal.GetReference`**: `Span` の先頭の要素を、参照として取り出します。
- **`unchecked`**: 整数の計算でオーバーフローが起きても、例外にせずそのまま扱う指定です。

## 何をしているか

### 1. 8 バイトを long として読む

```csharp:line-numbers=12
    internal static long ToInt64(ReadOnlySpan<byte> value)
        => Unsafe.ReadUnaligned<long>(ref Unsafe.AsRef(in MemoryMarshal.GetReference(value)));
```

`Span` の先頭の参照を取り出し、そこから 8 バイトを `long` として読みます。読む位置が整列されていなくても、`ReadUnaligned` が正しく読みます。

### 2. 符号なしの値は、同じバイトを別の型として読む

```csharp:line-numbers=15
    internal static ulong ToUInt64(ReadOnlySpan<byte> value) => unchecked((ulong)ToInt64(value));
```

`ToUInt64` は、`ToInt64` の結果を `unchecked` で `ulong` に変換します。同じ 8 バイトを、符号なしとして見るだけです。

### 3. 2 バイトと 4 バイトの版

```csharp:line-numbers=17
    internal static unsafe ushort ToUInt16(ReadOnlySpan<byte> value)
        => Unsafe.ReadUnaligned<ushort>(ref Unsafe.AsRef(in MemoryMarshal.GetReference(value)));

    internal static unsafe uint ToUInt32(ReadOnlySpan<byte> value)
        => Unsafe.ReadUnaligned<uint>(ref Unsafe.AsRef(in MemoryMarshal.GetReference(value)));
```

`ushort` と `uint` の版も、同じ方法で読みます。読む型の大きさだけが違います。

## ここがすごい

- **コピーしない**: バイトを 1 つずつ組み立てずに、メモリの内容を型として直接読むので、速く処理できます。
- **整列を気にしない**: 読む位置が 8 の倍数でなくても、正しく値が取れます。MessagePack のデータは、どの位置にも数値が来るので、この読み方が必要です。
- **変換の層を分ける**: 符号付きと符号なしは、同じ読み取りの結果を型の見方だけで変えています。
- **呼び出し側の責任**: 長さを確かめないことで、余計な検査を省いています。そのため、必要なバイト数が足りるかは、呼び出し側が確かめておく必要があります。

## まとめ

- `SafeBitConverter` は、バイト列の先頭から、整数の型として直接値を読む。
- `ReadUnaligned` により、整列されていない位置でも読める。
- 長さの確認は行わないので、呼び出し側が必要なバイト数を事前に保証する。
