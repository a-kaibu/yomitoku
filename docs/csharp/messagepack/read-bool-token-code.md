---
title: "先頭 1 バイトの型コードを見て、真偽値を読み取る"
description: "MessagePack-CSharp の TryReadBool。バッファの先頭 1 バイトが true（0xc3）か false（0xc2）かを調べ、真偽値を取り出す。空のバッファと型の違いを、別々の結果で返す。"
language: csharp
project: "MessagePack for C#"
repo: https://github.com/MessagePack-CSharp/MessagePack-CSharp
license: MIT
copyright: "Copyright (c) 2017 Yoshifumi Kawai and contributors"
commit: "9bc353141d0a280b6a470f1db29d3e0790cbb8b4"
file: src/MessagePack/MessagePackPrimitives.Readers.cs
lines: [255, 276]
function: "MessagePackPrimitives.TryReadBool(ReadOnlySpan<byte>, out bool, out int)"
difficulty: 2
format: 2
tags: [入出力, 防御的プログラミング, 低レイヤ]
---

## ひとことで

`TryReadBool` は、MessagePack のデータの先頭から **真偽値（true / false）** を読み取る関数です。
MessagePack では、true と false は、それぞれ 1 バイトの「型コード」で表されます。そのため、読むのは先頭の 1 バイトだけです。

読めたかどうかは、戻り値で伝えます。バッファが空だったのか、そこにあるのが真偽値ではなかったのか、を区別できます。

## コード

```csharp:line-numbers=255
    public static DecodeResult TryReadBool(ReadOnlySpan<byte> source, out bool value, out int tokenSize)
    {
        tokenSize = 1;
        if (source.Length == 0)
        {
            value = default;
            return DecodeResult.EmptyBuffer;
        }

        switch (source[0])
        {
            case MessagePackCode.True:
                value = true;
                return DecodeResult.Success;
            case MessagePackCode.False:
                value = false;
                return DecodeResult.Success;
            default:
                value = false;
                return DecodeResult.TokenMismatch;
        }
    }
```

## 前提知識

- **型コード**: MessagePack で、次のデータの種類（数、文字列、真偽値など）を表す 1 バイトの印です。
- **`DecodeResult`**: 読み取りの結果を表す列挙型です。ここでは、成功（`Success`）、空のバッファ（`EmptyBuffer`）、型の違い（`TokenMismatch`）の 3 種類を使います。
- **`out` 引数**: 関数の中で値を入れて、呼び出し側に返す引数です。ここでは、読んだ真偽値と、消費したバイト数を返します。
- **`ReadOnlySpan<byte>`**: 読み取り専用のバイトの並びです。
- **`switch` 文**: 1 つの値を、いくつかの場合に分けて処理する書き方です。

## 何をしているか

### 1. 空かどうかを確かめる

```csharp:line-numbers=257
        tokenSize = 1;
        if (source.Length == 0)
        {
            value = default;
            return DecodeResult.EmptyBuffer;
```

読むバイトがなければ、`EmptyBuffer` を返します。「まだ届いていない」という意味で、データが足りないことを伝えます。

### 2. 型コードで分ける

```csharp:line-numbers=264
        switch (source[0])
        {
            case MessagePackCode.True:
                value = true;
                return DecodeResult.Success;
            case MessagePackCode.False:
                value = false;
                return DecodeResult.Success;
```

先頭の 1 バイトが `True` のコードなら `true` を、`False` のコードなら `false` を、`Success` と一緒に返します。

### 3. それ以外は型の違い

```csharp:line-numbers=272
            default:
                value = false;
                return DecodeResult.TokenMismatch;
```

それ以外のバイトなら、真偽値ではないので、`TokenMismatch` を返します。値は `false` にしておきます。

## ここがすごい

- **1 バイトだけを見る**: 真偽値は型コードだけで決まるので、余計なデータを読まずに済みます。
- **失敗の理由を分ける**: 空（後で続きを読めば解決する）と、型違い（そもそも違うデータ）を区別できるので、呼び出し側の対応が決めやすくなります。
- **例外を使わない**: 読めなかったときも、戻り値で伝えるので、解析の流れの中で軽く扱えます。
- **消費したバイト数を返す**: `tokenSize` を 1 にして返すので、次にどこから読めばよいかが分かります。

## まとめ

- `TryReadBool` は、先頭 1 バイトの型コードで true と false を判定して読む。
- 空のバッファと型の違いを、別々の結果で返す。
- 例外を使わず、読んだバイト数と結果を戻り値で伝える。
