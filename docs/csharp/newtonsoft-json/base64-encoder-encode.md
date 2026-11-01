---
title: "長いバイト列を、3 バイトの倍数で区切って Base64 の行に書き出す"
description: "Newtonsoft.Json の Base64Encoder.Encode。バイト列を 57 バイトずつ Base64 にし、1 行 76 文字で書き出す。3 バイトの区切りが余ったら次の呼び出しに持ち越す。"
language: csharp
project: "Newtonsoft.Json"
repo: https://github.com/JamesNK/Newtonsoft.Json
license: MIT
copyright: "Copyright (c) 2007 James Newton-King"
commit: "52fa3aef1f2cadcd3a3f874251eddc98d3efbbaa"
file: Src/Newtonsoft.Json/Utilities/Base64Encoder.cs
lines: [75, 104]
function: "Base64Encoder.Encode(byte[], int, int)"
difficulty: 3
format: 2
tags: [入出力, 文字列処理, アルゴリズム]
---

## ひとことで

`Base64Encoder.Encode` は、バイト列を **Base64** という文字の並びに変えて、テキストに書き出す関数です。
Base64 は、バイナリのデータを英数字と記号だけで表す方法です。メールの添付ファイルなどで使われています。

この関数は、データを一度にすべて読み込まず、**少しずつ** 受け取って書き出せるように作られています。

## コード

```csharp:line-numbers=75
        public void Encode(byte[] buffer, int index, int count)
        {
            ValidateEncode(buffer, index, count);

            if (_leftOverBytesCount > 0)
            {
                if (FulfillFromLeftover(buffer, index, ref count))
                {
                    return;
                }

                int num2 = Convert.ToBase64CharArray(_leftOverBytes!, 0, 3, _charsLine, 0);
                WriteChars(_charsLine, 0, num2);
            }

            StoreLeftOverBytes(buffer, index, ref count);

            int num4 = index + count;
            int length = LineSizeInBytes;
            while (index < num4)
            {
                if ((index + length) > num4)
                {
                    length = num4 - index;
                }
                int num6 = Convert.ToBase64CharArray(buffer, index, length, _charsLine, 0);
                WriteChars(_charsLine, 0, num6);
                index += length;
            }
        }
```

## 前提知識

- **Base64**: 3 バイト（24 ビット）を 6 ビットずつ 4 つに分けて、4 文字で表す方法です。だから 3 バイトが 4 文字になります。
- **バイト列**: 0 から 255 までの数値が並んだデータです。画像やファイルの中身もバイト列です。
- **`TextWriter`**: 文字を書き出す先です。ファイルやメモリなどに文字を書けます。
- **余りの持ち越し**: 3 の倍数になっていない分を、次の呼び出しまで覚えておく仕組みです。
- **`Convert.ToBase64CharArray`**: バイト列の一部を Base64 の文字に変換して、配列へ書き込みます。

## 何をしているか

### 1. 余りを持ち越す

```csharp:line-numbers=92
            int num4 = index + count;
            int length = LineSizeInBytes;
```

今回受け取ったバイト数を 3 で割った余りを、次回まで取っておきます。Base64 は 3 バイト単位で変換するためです。

### 2. 3 の倍数の部分を変換する

```csharp:line-numbers=94
            while (index < num4)
            {
                if ((index + length) > num4)
                {
                    length = num4 - index;
                }
```

`LineSizeInBytes`（57 バイト）ずつ区切って変換します。残りが 57 に満たないときは、残りの長さに縮めます。

### 3. 1 回分を書き出す

```csharp:line-numbers=100
                int num6 = Convert.ToBase64CharArray(buffer, index, length, _charsLine, 0);
                WriteChars(_charsLine, 0, num6);
                index += length;
```

`Convert.ToBase64CharArray` で、その区切りを Base64 の文字に変えて `_charsLine` に入れ、書き出します。その後、次の位置へ進みます。

## ここがすごい

- **1 行 76 文字**: 57 バイトは 3 バイトの 19 倍で、Base64 では 4 × 19 = 76 文字になります。メールの規格で決められた 1 行の長さに合わせた数字です。
- **3 バイトの区切りを守る**: 余りを持ち越すので、途中で区切っても Base64 の変換がずれません。
- **文字の配列を使い回す**: `_charsLine` を最初から 1 つ確保して使い回し、書き出しのたびに新しい配列を作りません。
- **少しずつ書ける**: 大きなデータでも、一部ずつ変換して書き出せるので、メモリを多く使いません。

## まとめ

- `Encode` は、バイト列を Base64 に変えて、`TextWriter` へ行単位で書き出す。
- 3 バイトの区切りを守るため、余りは次の呼び出しに持ち越す。
- 57 バイトごとに変換するので、1 行は 76 文字になる。
