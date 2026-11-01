---
title: "配列の個数を、大きさに応じた短い形式で先頭に書く"
description: "MessagePack-CSharp の TryWriteArrayHeader。要素数が小さければ 1 バイト、中くらいなら 3 バイト、大きければ 5 バイトで配列の長さを書く。書き込み先が足りなければ、必要なバイト数だけを伝えて false を返す。"
language: csharp
project: "MessagePack for C#"
repo: https://github.com/MessagePack-CSharp/MessagePack-CSharp
license: MIT
copyright: "Copyright (c) 2017 Yoshifumi Kawai and contributors"
commit: "9bc353141d0a280b6a470f1db29d3e0790cbb8b4"
file: src/MessagePack/MessagePackPrimitives.Writers.cs
lines: [57, 91]
function: "MessagePackPrimitives.TryWriteArrayHeader(Span<byte>, uint, out int)"
difficulty: 2
format: 2
tags: [入出力, 低レイヤ, 防御的プログラミング]
---

## ひとことで

`TryWriteArrayHeader` は、MessagePack という形式で **配列の先頭に、要素数を書く** 関数です。
要素数が小さいほど、短いバイト列で書けます。
たとえば 3 個の配列は 1 バイト、1000 個の配列は 3 バイト、65535 個を超える配列は 5 バイトで表します。

MessagePack は、データを小さなバイト列にする形式です。読む側は、先頭のヘッダを見て、続く要素の数を知ります。

## コード

```csharp:line-numbers=57
    public static bool TryWriteArrayHeader(Span<byte> destination, uint count, out int bytesWritten)
    {
        switch (count)
        {
            case <= MessagePackRange.MaxFixArrayCount:
                bytesWritten = 1;
                if (destination.Length < bytesWritten)
                {
                    return false;
                }

                destination[0] = (byte)(MessagePackCode.MinFixArray | count);
                return true;
            case <= ushort.MaxValue:
                bytesWritten = 3;
                if (destination.Length < bytesWritten)
                {
                    return false;
                }

                destination[0] = MessagePackCode.Array16;
                WriteBigEndian(destination.Slice(1), (ushort)count);
                return true;
            default:
                bytesWritten = 5;
                if (destination.Length < bytesWritten)
                {
                    return false;
                }

                destination[0] = MessagePackCode.Array32;
                WriteBigEndian(destination.Slice(1), count);
                return true;
        }
    }
```

## 前提知識

- **MessagePack**: データを小さなバイト列で表す形式です。JSON より短くなることが多く、通信や保存に使われます。
- **ヘッダ（header）**: データの本体の前に置く、種類や大きさを表す部分です。
- **ビッグエンディアン**: 数値の上位のバイトを先に書く並べ方です。`WriteBigEndian` が、この順で書きます。
- **`Span<byte>`**: 書き込み先のバイトの領域です。長さが足りるかを確かめてから書きます。
- **`out int bytesWritten`**: 必要なバイト数を返すための引数です。書けたかどうかに関係なく、必要な数を伝えます。

## 何をしているか

### 1. 15 個以下なら 1 バイト

```csharp:line-numbers=59
        switch (count)
        {
            case <= MessagePackRange.MaxFixArrayCount:
                bytesWritten = 1;
                if (destination.Length < bytesWritten)
                {
                    return false;
                }

                destination[0] = (byte)(MessagePackCode.MinFixArray | count);
                return true;
```

要素数が `MaxFixArrayCount`（15）以下なら、先頭の 1 バイトに `0x90` と要素数を組み合わせて書きます。

### 2. 65535 個以下なら 3 バイト

```csharp:line-numbers=70
            case <= ushort.MaxValue:
                bytesWritten = 3;
                if (destination.Length < bytesWritten)
                {
                    return false;
                }

                destination[0] = MessagePackCode.Array16;
                WriteBigEndian(destination.Slice(1), (ushort)count);
                return true;
```

それ以上で `ushort.MaxValue` 以下なら、`Array16` の印（`0xDC`）の後に、要素数を 2 バイトで書きます。

### 3. それ以外は 5 バイト

```csharp:line-numbers=80
            default:
                bytesWritten = 5;
                if (destination.Length < bytesWritten)
                {
                    return false;
                }

                destination[0] = MessagePackCode.Array32;
                WriteBigEndian(destination.Slice(1), count);
                return true;
```

さらに大きい場合は、`Array32` の印（`0xDD`）の後に、要素数を 4 バイトで書きます。

## ここがすごい

- **大きさに合わせて短く書く**: 小さい配列ほど、ヘッダが 1 バイトで済みます。通信量を減らせます。
- **必要なバイト数を先に決める**: `bytesWritten` を先にセットしてから、書き込み先の長さを確かめるので、失敗しても必要な大きさが分かります。
- **例外を使わない**: 足りない場合は `false` を返すだけなので、通信のバッファ処理の中で軽く扱えます。
- **値の範囲で分岐する**: `switch` の範囲指定で、3 つの形式を分かりやすく振り分けています。

## まとめ

- `TryWriteArrayHeader` は、配列の要素数を、大きさに応じて 1、3、5 バイトの形式で書く。
- 数値は上位バイトから書く（ビッグエンディアン）。
- 書き込み先が足りないときは、必要なバイト数を伝えて `false` を返す。
