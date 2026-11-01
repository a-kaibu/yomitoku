---
title: "配列の長さを、先頭の型コードから 3 つの形式のどれかとして読む"
description: "MessagePack-CSharp の TryReadArrayHeader。先頭のバイトが小さい配列の形式なら下位 4 ビットから、16 ビットや 32 ビットの形式なら続くバイトを読んで長さを得る。データが足りないときは、必要なバイト数を伝えて戻る。"
language: csharp
project: "MessagePack for C#"
repo: https://github.com/MessagePack-CSharp/MessagePack-CSharp
license: MIT
copyright: "Copyright (c) 2017 Yoshifumi Kawai and contributors"
commit: "9bc353141d0a280b6a470f1db29d3e0790cbb8b4"
file: src/MessagePack/MessagePackPrimitives.Readers.cs
lines: [139, 183]
function: "MessagePackPrimitives.TryReadArrayHeader(ReadOnlySpan<byte>, out uint, out int)"
difficulty: 3
format: 2
tags: [入出力, 防御的プログラミング, 低レイヤ]
---

## ひとことで

`TryReadArrayHeader` は、MessagePack のデータの先頭から **配列の要素数** を読み取る関数です。
配列の形式は、要素数の大きさによって 3 つに分かれています。先頭の型コードを見て、どの形式かを判断し、続きのバイトから長さを取り出します。

書き込み側（`TryWriteArrayHeader`）の逆の操作です。

## コード

```csharp:line-numbers=139
    public static DecodeResult TryReadArrayHeader(ReadOnlySpan<byte> source, out uint count, out int tokenSize)
    {
        tokenSize = 1;
        if (source.Length == 0)
        {
            count = 0;
            return DecodeResult.EmptyBuffer;
        }

        switch (source[0])
        {
            case >= MessagePackCode.MinFixArray and <= MessagePackCode.MaxFixArray:
                count = (byte)(source[0] & 0xF);
                return DecodeResult.Success;

            case MessagePackCode.Array16:
                tokenSize = 3;
                if (TryReadBigEndian(source.Slice(1), out ushort ushortValue))
                {
                    count = ushortValue;
                    return DecodeResult.Success;
                }
                else
                {
                    count = 0;
                    return DecodeResult.InsufficientBuffer;
                }

            case MessagePackCode.Array32:
                tokenSize = 5;
                if (TryReadBigEndian(source.Slice(1), out uint uintValue))
                {
                    count = uintValue;
                    return DecodeResult.Success;
                }
                else
                {
                    count = 0;
                    return DecodeResult.InsufficientBuffer;
                }

            default:
                count = 0;
                return DecodeResult.TokenMismatch;
        }
```

## 前提知識

- **型コード**: 先頭の 1 バイトで、データの形式を表す印です。
- **固定長の配列（fixarray）**: 要素数が 15 以下の配列です。型コードの下位 4 ビットに、要素数がそのまま入っています。
- **ビッグエンディアン**: 数値の上位のバイトを先に書く並べ方です。読むときも、この順で組み立てます。
- **`TryReadBigEndian`**: 続くバイトを、指定の整数の型として読む関数です。足りなければ失敗を返します。
- **`InsufficientBuffer`**: バイトが足りないことを表す結果です。続きのデータが届けば、読み直せます。

## 何をしているか

### 1. 空のバッファを確かめる

```csharp:line-numbers=141
        tokenSize = 1;
        if (source.Length == 0)
        {
            count = 0;
            return DecodeResult.EmptyBuffer;
```

1 バイトも無ければ、`EmptyBuffer` を返します。

### 2. 小さい配列の形式

```csharp:line-numbers=150
            case >= MessagePackCode.MinFixArray and <= MessagePackCode.MaxFixArray:
                count = (byte)(source[0] & 0xF);
                return DecodeResult.Success;
```

型コードが fixarray の範囲なら、下位 4 ビット（`& 0xF`）が要素数です。追加のバイトは要りません。

### 3. 16 ビットの形式

```csharp:line-numbers=154
            case MessagePackCode.Array16:
                tokenSize = 3;
                if (TryReadBigEndian(source.Slice(1), out ushort ushortValue))
                {
                    count = ushortValue;
                    return DecodeResult.Success;
                }
                else
                {
                    count = 0;
                    return DecodeResult.InsufficientBuffer;
                }

```

`Array16` のコードなら、続く 2 バイトを読みます。読めれば要素数として使い、足りなければ `InsufficientBuffer` を返します。

### 4. 32 ビットの形式

```csharp:line-numbers=167
            case MessagePackCode.Array32:
                tokenSize = 5;
                if (TryReadBigEndian(source.Slice(1), out uint uintValue))
                {
                    count = uintValue;
                    return DecodeResult.Success;
                }
                else
                {
                    count = 0;
                    return DecodeResult.InsufficientBuffer;
                }

```

`Array32` のコードなら、続く 4 バイトを読みます。同じように、足りなければ `InsufficientBuffer` です。

### 5. それ以外は型の違い

```csharp:line-numbers=180
            default:
                count = 0;
                return DecodeResult.TokenMismatch;
```

どの形式にも当てはまらなければ、配列ではないので `TokenMismatch` を返します。

## ここがすごい

- **先頭 1 バイトで形式が決まる**: 型コードの範囲で、何バイト読むかが分かります。小さい配列はバイト数が増えません。
- **必要なバイト数を伝える**: `tokenSize` に、この形式で必要な大きさを入れるので、呼び出し側は、どれだけ届けばよいか分かります。
- **データが足りないことを区別する**: 「まだ届いていない」（`InsufficientBuffer`）と「そもそも違う」（`TokenMismatch`）を別の結果にしています。
- **書き込みと対になる**: `TryWriteArrayHeader` が選んだ形式を、この関数が同じ規則で読み戻します。

## まとめ

- `TryReadArrayHeader` は、先頭の型コードから配列の形式を判断し、要素数を読む。
- 小さい配列は下位 4 ビット、大きい配列は続くバイトから長さを組み立てる。
- データが足りない場合と型が違う場合を、別の結果として返す。
