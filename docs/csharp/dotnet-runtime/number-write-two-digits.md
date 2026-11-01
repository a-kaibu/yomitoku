---
title: "2 桁の数字を「1 回のストア」で書くための表とエンディアン対策"
description: "WriteTwoDigits は 00〜99 を 2 文字として書き込む関数。UTF-16 なら 4 バイト、UTF-8 なら 2 バイトの値を表から引き、1 回の書き込みで済ませる。ビッグエンディアン環境への対応もある。"
language: csharp
project: ".NET Runtime"
repo: https://github.com/dotnet/runtime
license: MIT
copyright: "Copyright (c) .NET Foundation and Contributors"
commit: "f368d14df0c3905d3b80073d709685af83ba895d"
file: src/libraries/Common/src/System/Number.Formatting.Common.cs
lines: [209, 251]
function: "Number.WriteTwoDigits<TChar>(uint, Span<TChar>)"
difficulty: 3
tags: [文字列処理, 低レイヤ, ジェネリクス]
---

## ひとことで

`WriteTwoDigits` は、0〜99 の数を **2 桁の数字の文字**（`7` なら `"07"`、`42` なら `"42"`）としてバッファに書き込む関数です。日時の書式化（`"09:05"` など）や数値の文字列化で、何度も呼ばれます。

ポイントは、2 文字を **1 回のメモリ書き込み** で済ませることです。そのために「2 文字を並べたバイト列」の表を用意し、CPU のバイト順（エンディアン）の違いにも対応しています。

## コード

```csharp:line-numbers=209
        [MethodImpl(MethodImplOptions.AggressiveInlining)]
        private static ushort GetTwoDigitsBytes(uint value)
        {
            ushort pair = TwoDigitsBytesTable[(int)value];
            if (!BitConverter.IsLittleEndian)
            {
                pair = (ushort)((pair << 8) | (pair >> 8));
            }
            return pair;
        }

        [MethodImpl(MethodImplOptions.AggressiveInlining)]
        private static uint GetTwoDigitsChars(uint value)
        {
            uint pair = TwoDigitsCharsTable[(int)value];
            if (!BitConverter.IsLittleEndian)
            {
                pair = uint.RotateRight(pair, 16);
            }
            return pair;
        }

        /// <summary>Writes a value [ 00 .. 99 ] to the start of a pre-sliced 2-element span, using a single store.</summary>
        [MethodImpl(MethodImplOptions.AggressiveInlining)]
        internal static void WriteTwoDigits<TChar>(uint value, Span<TChar> destination) where TChar : unmanaged, IUtfChar<TChar>
        {
            Debug.Assert(value <= 99);
            Debug.Assert(destination.Length >= 2);
            Debug.Assert(sizeof(TChar) is sizeof(char) or sizeof(byte));

            if (sizeof(TChar) == sizeof(char))
            {
                // TwoDigitsCharsTable[v] = (char)('0'+v/10) | ((char)('0'+v%10) << 16) — write both chars as one 4-byte store.
                uint pair = GetTwoDigitsChars(value);
                MemoryMarshal.Write(MemoryMarshal.AsBytes(Unsafe.BitCast<Span<TChar>, Span<char>>(destination)), in pair);
            }
            else
            {
                // Write both bytes as a single 2-byte store.
                ushort pair = GetTwoDigitsBytes(value);
                MemoryMarshal.Write(Unsafe.BitCast<Span<TChar>, Span<byte>>(destination), in pair);
            }
        }
```

表の中身は 195〜207 行目にあり、194 行目のコメントの通り、`entry[v] = (char)('0' + v/10) | ((char)('0' + v%10) << 16)` という式で作られた 100 個の値です。

## 前提知識

- **UTF-16 と UTF-8**: C# の `char` は UTF-16 で 1 文字 2 バイト、UTF-8 では ASCII の数字は 1 文字 1 バイトです。この関数はどちらでも動くよう、型引数 `TChar` で文字の種類を受け取ります。
- **ジェネリクスの制約 `where TChar : unmanaged, IUtfChar<TChar>`**: TChar は「ポインタを含まない値型」で、「UTF の文字として扱えるもの」（`char` か `byte`）に限る、という条件です。
- **`sizeof(TChar) == sizeof(char)`**: TChar のバイト数で分岐しています。ジェネリクスの型が決まると JIT にとって定数になるので、不要な側は消えます。
- **エンディアン**: 複数バイトの数値をメモリに置くときの順番です。リトルエンディアン（x86 や Arm の多く）は下位バイトから、ビッグエンディアンは上位バイトから並べます。
- **`MemoryMarshal.Write(span, in value)`**: 値を、そのままのバイト列として span の先頭に書き込みます。
- **`Unsafe.BitCast<Span<TChar>, Span<char>>`**: 型だけを読み替える操作です。`TChar` が `char` だとわかっている分岐の中なので、安全に読み替えられます。

## 何をしているか

### 1. 表を引く（221〜229 行目）

42 なら `TwoDigitsCharsTable[42]` = `0x00320034` を取り出します。表の作り方（194 行目）の通り、**下位 16 ビットが十の位**（0x34 = `'4'`）、**上位 16 ビットが一の位**（0x32 = `'2'`）です。

リトルエンディアンの CPU では、32 ビット値をメモリに書くと下位 16 ビットが先（小さいアドレス）に置かれます。なので、そのまま書くだけで `'4'`、`'2'` の順に並び、`"42"` になります。
ビッグエンディアンの CPU では上位 16 ビットが先になってしまうので、226 行目で 16 ビット回転して上下を入れ替えてから使います。UTF-8 用の 2 バイト版（210〜218 行目）も、同じ理由でバイトを入れ替えます。

### 2. 1 回で書き込む（239〜250 行目）

UTF-16 なら 4 バイトの `uint` を、UTF-8 なら 2 バイトの `ushort` を、`MemoryMarshal.Write` で 1 回で書きます。

## ここがすごい

- **割り算も足し算もない**: 素直に書くと `'0' + v / 10` と `'0' + v % 10` を計算して 2 回書き込みます。この関数は表引き 1 回と書き込み 1 回だけです。表は 100 要素×4 バイト = 400 バイトで、DLL のデータ領域に埋め込まれます。
- **1 つのコードで UTF-16 と UTF-8 の両方に対応**: ジェネリクスと `sizeof` の分岐を使い、型ごとに最適な版を JIT に作らせています。文字列（UTF-16）とネットワーク向けのバイト列（UTF-8）の両方に、同じ書式化のコードを使えます。
- **エンディアンの違いを吸収**: `BitConverter.IsLittleEndian` も JIT にとって定数なので、リトルエンディアンの CPU では回転の処理ごと消えます。移植性とスピードを両立しています。

## まとめ

- 2 文字を 1 つの整数として表にしておくと、1 回の書き込みで 2 文字を出力できる。
- 複数バイトの値をメモリに書くときは、エンディアンに注意する。`IsLittleEndian` で分岐すれば、不要な側は JIT が消す。
- ジェネリクスで文字の型を受け取ると、UTF-16 と UTF-8 を 1 つのコードで扱える。
