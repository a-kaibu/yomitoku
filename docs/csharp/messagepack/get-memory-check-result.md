---
title: "書き込み先の領域を取得し、返された領域が正しいかを確かめる"
description: "MessagePack の GetMemoryCheckResult。IBufferWriter から書き込み用の領域を受け取り、空だったり要求より小さかったりしたら、実装の誤りとして例外を投げる。"
language: csharp
project: "MessagePack for C#"
repo: https://github.com/MessagePack-CSharp/MessagePack-CSharp
license: MIT
copyright: "Copyright (c) 2017 Yoshifumi Kawai and contributors"
commit: "9bc353141d0a280b6a470f1db29d3e0790cbb8b4"
file: src/MessagePack/Utilities.cs
lines: [30, 44]
function: "Utilities.GetMemoryCheckResult(IBufferWriter<byte>, int)"
difficulty: 2
format: 2
tags: [メモリ管理, 防御的プログラミング, エラー処理]
---

## ひとことで

`GetMemoryCheckResult` は、`IBufferWriter<byte>` という書き込み先から、**書き込み用のメモリ領域** を受け取る関数です。
受け取った領域が、空でなく、要求したサイズ以上かを確かめてから返します。

MessagePack は、書き込み先が返すメモリを信用して書き込みます。もし、その領域が小さすぎると、知らない場所に書いてしまうおそれがあるため、ここで確かめています。

## コード

```csharp:line-numbers=30
        internal static Memory<byte> GetMemoryCheckResult(this IBufferWriter<byte> bufferWriter, int size = 0)
        {
            Memory<byte> memory = bufferWriter.GetMemory(size);
            if (memory.IsEmpty)
            {
                ThrowInvalidOperationException("The underlying IBufferWriter<byte>.GetMemory(int) method returned an empty memory block, which is not allowed. This is a bug in " + bufferWriter.GetType().FullName);
            }

            if (memory.Length < size)
            {
                ThrowInvalidOperationException("The underlying IBufferWriter<byte>.GetMemory(int) returned a buffer that is smaller than the requested size. This is a bug in " + bufferWriter.GetType().FullName);
            }

            return memory;

```

## 前提知識

- **`IBufferWriter<byte>`**: バイト列の書き込み先を表す共通の約束（インターフェース）です。`GetMemory` で、書き込める領域を借ります。
- **`Memory<byte>`**: バイト列の一部分を指す型です。配列を複製せずに、その範囲を扱えます。
- **`IsEmpty` と `Length`**: `IsEmpty` は、領域が空かを表します。`Length` は、領域の長さ（バイト数）です。
- **`InvalidOperationException`**: 操作が、今の状態では許されないときに投げる例外です。
- **実装の誤り**: ここで例外になるのは、呼び出し側の誤りではなく、`IBufferWriter` を実装した側の誤りです。

## 何をしているか

### 1. 書き込み用の領域を受け取る

```csharp:line-numbers=32
            Memory<byte> memory = bufferWriter.GetMemory(size);
```

`GetMemory(size)` で、書き込み先に領域を要求します。

### 2. 空の領域を弾く

```csharp:line-numbers=33
            if (memory.IsEmpty)
            {
                ThrowInvalidOperationException("The underlying IBufferWriter<byte>.GetMemory(int) method returned an empty memory block, which is not allowed. This is a bug in " + bufferWriter.GetType().FullName);
            }
```

受け取った領域が空なら、例外を投げます。`IBufferWriter` の約束では、空の領域は返してはいけないことになっています。例外のメッセージには、実装の型名を入れて、どこの誤りかが分かるようにしています。

### 3. 要求より小さい領域を弾く

```csharp:line-numbers=38
            if (memory.Length < size)
            {
                ThrowInvalidOperationException("The underlying IBufferWriter<byte>.GetMemory(int) returned a buffer that is smaller than the requested size. This is a bug in " + bufferWriter.GetType().FullName);
            }
```

要求した `size` より短い領域が返ってきたら、例外を投げます。短い領域に書くと、足りなくなって壊れるからです。

### 4. 確かめた領域を返す

```csharp:line-numbers=43
            return memory;
```

確かめが終わった領域を返します。

## ここがすごい

- **誤りを早く見つける**: 書き込みを始める前に、おかしな領域を検出します。壊れたデータを書き出す前に止まります。
- **誰の誤りかを示す**: 例外のメッセージに実装の型名を入れているので、どの実装が約束を破ったかが分かります。
- **例外を別の関数に分ける**: 例外を投げる部分は別の関数にまとめ、このメソッドは短く保っています。

## まとめ

- 書き込み用の領域を、`GetMemory` で受け取る。
- 空の領域や、要求より小さい領域は例外にする。
- 確かめた領域だけを、呼び出し側に返す。
