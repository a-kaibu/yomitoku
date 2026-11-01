---
title: "書き込み先に入るなら直接コピー、入らなければ分けて書く"
description: "MessagePack-CSharp の BufferWriter.Write。現在の書き込み領域に残りが足りれば、そのままコピーして位置を進める。足りなければ、複数のバッファにまたがって書く処理へ回す。"
language: csharp
project: "MessagePack for C#"
repo: https://github.com/MessagePack-CSharp/MessagePack-CSharp
license: MIT
copyright: "Copyright (c) 2017 Yoshifumi Kawai and contributors"
commit: "9bc353141d0a280b6a470f1db29d3e0790cbb8b4"
file: src/MessagePack/BufferWriter.cs
lines: [161, 172]
function: "BufferWriter.Write(ReadOnlySpan<byte>)"
difficulty: 2
format: 2
tags: [入出力, 最適化, メモリ管理]
---

## ひとことで

`BufferWriter` は、MessagePack のデータを **バイトの領域へ順に書き込む** 入れ物です。
`Write(source)` は、そのバイト列を書き込む関数です。現在の領域に収まるなら、そのままコピーします。収まらなければ、複数の領域にまたがる書き込みへ回します。

## コード

```csharp:line-numbers=161
        public void Write(ReadOnlySpan<byte> source)
        {
            if (_span.Length >= source.Length)
            {
                source.CopyTo(_span);
                Advance(source.Length);
            }
            else
            {
                WriteMultiBuffer(source);
            }
        }
```

## 前提知識

- **`Span<byte>`**: バイトの領域を指す型です。`Length` で、残りの大きさが分かります。
- **書き込みの位置**: 次にバイトを書く場所です。書いた分だけ進みます。
- **`CopyTo`**: 1 つの領域の内容を、別の領域へコピーします。
- **マルチバッファ（複数バッファ）**: 大きなデータを、いくつかの小さな領域に分けて保持する仕組みです。書き込み先が途中で足りなくなったときに使います。
- **`AggressiveInlining`**: 短い関数を、呼び出し元に直接展開するように頼む印です。書き込みは頻繁に呼ばれるので、この印で速くしています。

## 何をしているか

### 1. 残りの領域に収まるかを確かめる

```csharp:line-numbers=163
            if (_span.Length >= source.Length)
```

現在の領域の残りの大きさ（`_span.Length`）が、書きたいデータの長さ以上なら、そのまま書けます。

### 2. 収まるなら直接コピーして進める

```csharp:line-numbers=165
                source.CopyTo(_span);
                Advance(source.Length);
```

データを現在の領域へコピーし、書いた分だけ位置を進めます。新しい領域は作りません。

### 3. 収まらなければ分けて書く

```csharp:line-numbers=168
            else
            {
                WriteMultiBuffer(source);
            }
```

残りの領域に収まらなければ、`WriteMultiBuffer` に任せます。ここでは、領域をまたいで、データを分けて書きます。

## ここがすごい

- **よくある場合が速い**: 残りに収まる場合は、コピーと位置の更新だけで終わります。
- **分岐が 1 つ**: 収まるかどうかの判定が 1 回だけなので、読みやすく、無駄な処理がありません。
- **大きなデータも扱える**: 収まらないときは、複数の領域に分けて書くので、データの大きさに上限を作りません。
- **位置の管理を 1 か所に**: `Advance` で位置を進める処理にまとめているので、書いた量のずれが起きにくくなっています。

## まとめ

- `Write` は、残りの領域に収まれば直接コピーして、書いた分だけ位置を進める。
- 収まらなければ、複数の領域にまたがって書く処理に回す。
- よくある小さな書き込みを速く、大きな書き込みも正しく扱えるように作られている。
