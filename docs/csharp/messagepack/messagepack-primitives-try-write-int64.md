---
title: "整数の値に合わせて、いちばん短い形で書き込む MessagePack"
description: "MessagePack の TryWrite(long)。非負なら符号なしの書き方に任せ、負の数は値の範囲に応じて 1 バイトから 8 バイトの形式を選んで書き込む。"
language: csharp
project: "MessagePack for C#"
repo: https://github.com/MessagePack-CSharp/MessagePack-CSharp
license: MIT
copyright: "Copyright (c) 2017 Yoshifumi Kawai and contributors"
commit: "9bc353141d0a280b6a470f1db29d3e0790cbb8b4"
file: src/MessagePack/MessagePackPrimitives.Writers.cs
lines: [270, 290]
function: "MessagePackPrimitives.TryWrite(Span<byte>, long, out int)"
difficulty: 2
format: 2
tags: [ネットワーク, 数値計算, 入出力]
---

## ひとことで

`TryWrite(destination, value, out bytesWritten)` は、`long` の整数を **MessagePack**（バイナリ形式の軽いデータ形式）で、できるだけ短いバイト数に詰めて書き込む関数です。
たとえば `5` は 1 バイト、`-3` も 1 バイト、`300` は 3 バイトで書かれます。

書き込む先の領域（`destination`）が足りなければ書かずに `false` を返し、必要なバイト数を `bytesWritten` で伝えます。

## コード

```csharp:line-numbers=270
    public static bool TryWrite(Span<byte> destination, long value, out int bytesWritten)
    {
        if (value >= 0)
        {
            return TryWrite(destination, unchecked((ulong)value), out bytesWritten);
        }

        return SlowPath(destination, value, out bytesWritten);
        static bool SlowPath(Span<byte> destination, long value, out int bytesWritten)
        {
            switch (value)
            {
                case >= 0: return TryWrite(destination, (ulong)value, out bytesWritten);
                case >= MessagePackRange.MinFixNegativeInt: return TryWriteNegativeFixIntUnsafe(destination, unchecked((sbyte)value), out bytesWritten);
                case >= sbyte.MinValue: return TryWriteInt8(destination, (sbyte)value, out bytesWritten);
                case >= short.MinValue: return TryWriteInt16(destination, (short)value, out bytesWritten);
                case >= int.MinValue: return TryWriteInt32(destination, (int)value, out bytesWritten);
                default: return TryWriteInt64(destination, value, out bytesWritten);
            }
        }
    }
```

## 前提知識

- **MessagePack**: JSON と似た、データを小さなバイト列で表す形式です。値の種類ごとに先頭 1 バイトの「コード」があり、その後に値が続きます。
- **`Span<byte>`**: バイト列の「窓」です。コピーせずに、書き込む先の一部を指せます。
- **`out int bytesWritten`**: 書き込んだバイト数を呼び出し側に返すための引数です。
- **`unchecked((ulong)value)`**: 範囲チェックを行わずに型を変換します。負の数を `ulong` として読み直すので、符号は失われます。
- **`switch` の `case >= 値`**: 範囲で場合分けする C# の書き方です。上から順に判定されます。
- **`MessagePackRange.MinFixNegativeInt`**: 「小さな負の数だけは 1 バイトで書ける」範囲の下限です。

## 何をしているか

### 1. 0 以上の値は符号なしの処理に任せる

```csharp:line-numbers=272
        if (value >= 0)
        {
            return TryWrite(destination, unchecked((ulong)value), out bytesWritten);
        }
```

非負の数は、符号なしの `ulong` として書き込む関数に任せます。非負の数は符号が要らないので、同じ処理で済みます。

### 2. 負の数は範囲で分ける

```csharp:line-numbers=277
        return SlowPath(destination, value, out bytesWritten);
        static bool SlowPath(Span<byte> destination, long value, out int bytesWritten)
        {
            switch (value)
            {
                case >= 0: return TryWrite(destination, (ulong)value, out bytesWritten);
                case >= MessagePackRange.MinFixNegativeInt: return TryWriteNegativeFixIntUnsafe(destination, unchecked((sbyte)value), out bytesWritten);
                case >= sbyte.MinValue: return TryWriteInt8(destination, (sbyte)value, out bytesWritten);
                case >= short.MinValue: return TryWriteInt16(destination, (short)value, out bytesWritten);
                case >= int.MinValue: return TryWriteInt32(destination, (int)value, out bytesWritten);
                default: return TryWriteInt64(destination, value, out bytesWritten);
            }
        }
```

負の数は `SlowPath` で処理します。`switch` の上から順に、次のように判定します。

- `-32` 以上なら、1 バイトに入る「小さな負の数」の形式で書く。
- `-128` 以上なら `Int8`（2 バイト）。
- `-32768` 以上なら `Int16`（3 バイト）。
- `int.MinValue` 以上なら `Int32`（5 バイト）。
- それより小さいなら `Int64`（9 バイト）。

たとえば `-100` は `Int8` の範囲なので 2 バイトです。`-100000` は `Int32` の範囲なので 5 バイトです。

## ここがすごい

- **値に合う最も短い形式を選ぶ**: 小さい数字は 1 バイトで済みます。通信量を減らしたい MessagePack の目的を、書き込みの段階で実現しています。
- **非負と負で入口を分ける**: 非負の数は、もっともよく使われる形式に任せて、負の数だけを特別扱いしています。
- **書き込む前に場所を確かめる**: 書き込み先が足りないときは `false` を返し、必要なバイト数を伝えます。呼び出し側は、足りなければ大きな領域を用意し直せばよいので、例外を使う必要がありません。
- **`switch` の順番に意味がある**: 小さい範囲から順に判定しているので、一番短い形式が最初に選ばれます。

## まとめ

- 整数を小さなバイト列にするには、値の範囲に合わせて形式を選ぶとよい。
- 非負と負で処理を分けると、それぞれの符号の扱いが分かりやすくなる。
- 書き込み先の大きさを戻り値で伝えると、例外なしに安全に動く API になる。
