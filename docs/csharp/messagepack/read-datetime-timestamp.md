---
title: "3 つの長さの日時データを、1970 年からの秒とナノ秒に分けて読む"
description: "MessagePack-CSharp の TryReadDateTime（拡張ヘッダ付き）。タイムスタンプの拡張型は 4・8・12 バイトの 3 形式があり、それぞれ秒とナノ秒の並べ方が違う。長さに応じて読み方を切り替え、UnixEpoch からの時刻を作る。"
language: csharp
project: "MessagePack for C#"
repo: https://github.com/MessagePack-CSharp/MessagePack-CSharp
license: MIT
copyright: "Copyright (c) 2017 Yoshifumi Kawai and contributors"
commit: "9bc353141d0a280b6a470f1db29d3e0790cbb8b4"
file: src/MessagePack/MessagePackPrimitives.Readers.cs
lines: [336, 378]
function: "MessagePackPrimitives.TryReadDateTime(ReadOnlySpan<byte>, ExtensionHeader, out DateTime, out int)"
difficulty: 3
format: 2
tags: [日時, 入出力, 低レイヤ]
---

## ひとことで

MessagePack には、日時を表すための **タイムスタンプ** という拡張の形式があります。この関数は、その中身を読んで `DateTime` に直します。
タイムスタンプは、1970 年 1 月 1 日からの **秒** と、その中の **ナノ秒** で時刻を表します。データの長さによって、秒とナノ秒の並べ方が 3 通りあります。

## コード

```csharp:line-numbers=336
    public static DecodeResult TryReadDateTime(ReadOnlySpan<byte> source, ExtensionHeader header, out DateTime value, out int tokenSize)
    {
        tokenSize = checked((int)header.Length);
        if (header.TypeCode != ReservedMessagePackExtensionTypeCode.DateTime)
        {
            value = default;
            return DecodeResult.TokenMismatch;
        }

        if (header.Length is not (4 or 8 or 12))
        {
            value = default;
            return DecodeResult.TokenMismatch;
        }

        if (source.Length < tokenSize)
        {
            value = default;
            return DecodeResult.InsufficientBuffer;
        }

        switch (header.Length)
        {
            case 4:
                AssumesTrue(TryReadBigEndian(source, out uint uintValue));
                value = DateTimeConstants.UnixEpoch.AddSeconds(uintValue);
                return DecodeResult.Success;
            case 8:
                AssumesTrue(TryReadBigEndian(source, out ulong ulongValue));
                long nanoseconds = (long)(ulongValue >> 34);
                ulong seconds = ulongValue & 0x00000003ffffffffL;
                value = DateTimeConstants.UnixEpoch.AddSeconds(seconds).AddTicks(nanoseconds / DateTimeConstants.NanosecondsPerTick);
                return DecodeResult.Success;
            case 12:
                AssumesTrue(TryReadBigEndian(source, out uintValue));
                nanoseconds = uintValue;
                AssumesTrue(TryReadBigEndian(source.Slice(sizeof(uint)), out long longValue));
                value = DateTimeConstants.UnixEpoch.AddSeconds(longValue).AddTicks(nanoseconds / DateTimeConstants.NanosecondsPerTick);
                return DecodeResult.Success;
            default:
                value = default;
                return DecodeResult.TokenMismatch;
        }
```

## 前提知識

- **拡張型（extension）**: MessagePack で、独自の意味を持つデータを入れるための仕組みです。型コードの番号で、その意味を区別します。
- **UNIX 時刻**: 1970 年 1 月 1 日 0 時（UTC）からの経過秒です。`DateTimeConstants.UnixEpoch` は、この基準の時刻です。
- **ナノ秒**: 1 秒の 10 億分の 1 です。`NanosecondsPerTick` は、ナノ秒を .NET の tick（100 ナノ秒）に直すための値です。
- **ビットのずらし（`>>`）とマスク（`&`）**: 1 つの数値から、上位の部分と下位の部分を取り出す操作です。
- **ビッグエンディアン**: 上位のバイトを先に書く並べ方です。

## 何をしているか

### 1. 長さで形式を選ぶ

```csharp:line-numbers=338
        tokenSize = checked((int)header.Length);
        if (header.TypeCode != ReservedMessagePackExtensionTypeCode.DateTime)
        {
            value = default;
            return DecodeResult.TokenMismatch;
        }

        if (header.Length is not (4 or 8 or 12))
        {
            value = default;
            return DecodeResult.TokenMismatch;
        }
```

ヘッダの長さが 4、8、12 のどれかでなければ、タイムスタンプではないので `TokenMismatch` を返します。

```csharp:line-numbers=351
        if (source.Length < tokenSize)
        {
            value = default;
            return DecodeResult.InsufficientBuffer;
        }
```

必要なバイト数が足りなければ、`InsufficientBuffer` を返します。

### 2. 4 バイトの形式: 秒だけ

```csharp:line-numbers=357
        switch (header.Length)
        {
            case 4:
                AssumesTrue(TryReadBigEndian(source, out uint uintValue));
                value = DateTimeConstants.UnixEpoch.AddSeconds(uintValue);
                return DecodeResult.Success;
```

4 バイトは、1970 年からの秒（符号なし 32 ビット）だけです。ナノ秒は含まれません。

### 3. 8 バイトの形式: 秒とナノ秒を詰め込む

```csharp:line-numbers=363
            case 8:
                AssumesTrue(TryReadBigEndian(source, out ulong ulongValue));
                long nanoseconds = (long)(ulongValue >> 34);
                ulong seconds = ulongValue & 0x00000003ffffffffL;
                value = DateTimeConstants.UnixEpoch.AddSeconds(seconds).AddTicks(nanoseconds / DateTimeConstants.NanosecondsPerTick);
                return DecodeResult.Success;
```

8 バイトの 64 ビットを、上位 30 ビットはナノ秒、下位 34 ビットは秒として取り出します。ナノ秒を tick に直して加えます。

### 4. 12 バイトの形式: ナノ秒と秒を分けて書く

```csharp:line-numbers=369
            case 12:
                AssumesTrue(TryReadBigEndian(source, out uintValue));
                nanoseconds = uintValue;
                AssumesTrue(TryReadBigEndian(source.Slice(sizeof(uint)), out long longValue));
                value = DateTimeConstants.UnixEpoch.AddSeconds(longValue).AddTicks(nanoseconds / DateTimeConstants.NanosecondsPerTick);
                return DecodeResult.Success;
```

最初の 4 バイトがナノ秒、残りの 8 バイトが符号付きの秒です。秒の範囲を、より広く扱えます。

## ここがすごい

- **短く書ける形式を用意**: 秒だけで十分な場合は 4 バイトで済みます。ナノ秒が必要なときは 8 バイトに詰め、範囲がさらに必要なら 12 バイトにします。
- **1 つの数に詰める工夫**: 8 バイトの形式では、ビットのずらしとマスクで、秒とナノ秒を 1 つの `ulong` から取り出します。
- **長さの確認を先に**: 形式が違うものや、データが足りないものを、読み始める前に弾きます。
- **既知の形式どおりに読む**: 書く側と同じ規則で読むので、往復しても同じ時刻に戻ります。

## まとめ

- タイムスタンプは、4・8・12 バイトの 3 形式があり、長さで読み方を選ぶ。
- 8 バイトの形式は、上位 30 ビットがナノ秒、下位 34 ビットが秒である。
- 読んだ秒とナノ秒を、UNIX 時刻の基準に足して `DateTime` を作る。
