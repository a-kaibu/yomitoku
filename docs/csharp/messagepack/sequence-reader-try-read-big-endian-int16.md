---
title: "分割されたバイト列から、ビッグエンディアンの 16 ビット整数を読む"
description: "MessagePack の SequenceReaderExtensions.TryReadBigEndian(short)。SequenceReader からバイトを読み、実行環境がリトルエンディアンなら、バイト順を入れ替えて値を得る。"
language: csharp
project: "MessagePack for C#"
repo: https://github.com/MessagePack-CSharp/MessagePack-CSharp
license: MIT
copyright: "Copyright (c) 2017 Yoshifumi Kawai and contributors"
commit: "9bc353141d0a280b6a470f1db29d3e0790cbb8b4"
file: src/MessagePack/SequenceReaderExtensions.cs
lines: [87, 95]
function: "SequenceReaderExtensions.TryReadBigEndian(ref SequenceReader<byte>, out short)"
difficulty: 2
format: 2
tags: [パース, 低レイヤ, 移植性]
---

## ひとことで

`TryReadBigEndian` は、バイトの並びから **16 ビットの整数（`short`）** を、**ビッグエンディアン**（上位のバイトが先に来る形式）として読む関数です。
たとえば `0x01 0x02` という 2 バイトは、ビッグエンディアンでは `0x0102`（258）になります。

データが複数の区切り（セグメント）に分かれていても、`SequenceReader` が続きを読んでくれます。

## コード

```csharp:line-numbers=87
        public static bool TryReadBigEndian(ref this SequenceReader<byte> reader, out short value)
        {
            if (!BitConverter.IsLittleEndian)
            {
                return reader.TryRead(out value);
            }

            return TryReadReverseEndianness(ref reader, out value);
        }
```

## 前提知識

- **エンディアン**: 複数バイトの数を、どの順に並べるかの決まりです。上位のバイトが先に来るのがビッグエンディアン、後に来るのがリトルエンディアンです。
- **`BitConverter.IsLittleEndian`**: 実行している機械が、リトルエンディアンかを表す値です。
- **`SequenceReader<byte>`**: 複数の区切りに分かれたバイト列を、順に読むための道具です。
- **`BinaryPrimitives.ReverseEndianness`**: 数のバイト順を、逆にする .NET の関数です。
- **`out` 引数**: 読んだ値を、呼び出し側に渡す引数です。戻り値の `bool` で、読めたかを示します。

## 何をしているか

### 1. 機械がビッグエンディアンなら、そのまま読む

```csharp:line-numbers=89
            if (!BitConverter.IsLittleEndian)
            {
                return reader.TryRead(out value);
```

実行環境がビッグエンディアンなら、バイトの並びが、そのまま読むべき形です。`reader.TryRead` で、そのまま読みます。

### 2. リトルエンディアンなら、バイト順を入れ替える

```csharp:line-numbers=94
            return TryReadReverseEndianness(ref reader, out value);
```

実行環境がリトルエンディアンなら、バイトの並びが逆になっています。`TryReadReverseEndianness` で、バイトを読んでから順番を逆にします。

### 3. 逆にする処理の中身

```csharp:line-numbers=113
        private static bool TryReadReverseEndianness(ref SequenceReader<byte> reader, out short value)
        {
            if (reader.TryRead(out value))
            {
                value = BinaryPrimitives.ReverseEndianness(value);
                return true;
            }

            return false;
        }
```

`TryRead` で値を読み、読めたら `BinaryPrimitives.ReverseEndianness` でバイト順を入れ替えます。データが足りなければ、`false` を返します。

## ここがすごい

- **機械に合わせて手間を変える**: 実行環境がビッグエンディアンなら、入れ替えの処理を省きます。
- **分割されたデータに対応**: `SequenceReader` を使うので、データが複数の区切りに分かれていても、読み方は同じです。
- **データ不足を戻り値で伝える**: 足りないときは例外ではなく `false` を返すので、続きを待つ処理が書きやすくなっています。

## まとめ

- 読むデータはビッグエンディアンなので、機械の並びに合わせて対応する。
- リトルエンディアンの機械では、読んだあとにバイト順を入れ替える。
- 足りなければ `false` を返す。
