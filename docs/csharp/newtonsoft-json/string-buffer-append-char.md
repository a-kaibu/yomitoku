---
title: "1 文字ずつ溜めるバッファで、足りなくなったら借り直して広げる"
description: "Newtonsoft.Json の StringBuffer.Append(char)。文字の配列に 1 文字ずつ書き込み、いっぱいになったら、より大きい配列を借りて中身を移す。古い配列は返して再利用する。"
language: csharp
project: "Newtonsoft.Json"
repo: https://github.com/JamesNK/Newtonsoft.Json
license: MIT
copyright: "Copyright (c) 2007 James Newton-King"
commit: "52fa3aef1f2cadcd3a3f874251eddc98d3efbbaa"
file: Src/Newtonsoft.Json/Utilities/StringBuffer.cs
lines: [56, 66]
function: "StringBuffer.Append(IArrayPool<char>?, char)"
difficulty: 3
format: 2
tags: [文字列処理, メモリ管理, 最適化]
---

## ひとことで

`StringBuffer` は、JSON を読んだり書いたりするときに、**文字を 1 つずつ溜めるための入れ物** です。
`Append(bufferPool, value)` は、その末尾に 1 文字を追加します。配列がいっぱいになったら、もっと大きな配列を用意して、中身を移します。

文字列を `+` で何度もつなぐと、そのたびに新しい文字列ができて遅くなります。この入れ物は、配列の中に直接書き込むことで、その無駄を避けています。

## コード

::: code-group

```csharp:line-numbers=56 [日本語訳]
        public void Append(IArrayPool<char>? bufferPool, char value)
        {
            // バッファの配列に、この 1 文字を入れる余裕があるかを確かめる。
            if (_position == _buffer!.Length)
            {
                EnsureSize(bufferPool, 1);
            }

            // 値を入れて、書き込みの位置を 1 つ進める。
            _buffer![_position++] = value;
        }
```

```csharp:line-numbers=56 [原文]
        public void Append(IArrayPool<char>? bufferPool, char value)
        {
            // test if the buffer array is large enough to take the value
            if (_position == _buffer!.Length)
            {
                EnsureSize(bufferPool, 1);
            }

            // set value and increment poisition
            _buffer![_position++] = value;
        }
```

:::

## 前提知識

- **文字の配列（`char[]`）**: 文字を並べて入れる、固定の長さの配列です。
- **書き込みの位置（`_position`）**: 次に文字を書く場所です。文字を入れるたびに 1 つ進みます。
- **`IArrayPool<char>`**: 配列を使い回すための仕組みです。借りる（Rent）と返す（Return）の 2 つの操作があります。
- **`Array.Copy`**: 配列の中身を、別の配列へまとめてコピーします。
- **`!`（null でないと約束する印）**: `_buffer` が null でないことを、コンパイラに伝えています。

## 何をしているか

### 1. 余裕があるかを確かめる

```csharp:line-numbers=58
            // バッファの配列に、この 1 文字を入れる余裕があるかを確かめる。
            if (_position == _buffer!.Length)
            {
                EnsureSize(bufferPool, 1);
```

書き込む位置が配列の長さに達していれば、いっぱいなので広げます。広げる処理は `EnsureSize` が行います。

### 2. 文字を書いて、位置を進める

```csharp:line-numbers=64
            // 値を入れて、書き込みの位置を 1 つ進める。
            _buffer![_position++] = value;
```

配列の書き込み位置に文字を入れて、位置を 1 つ進めます。

### 3. 広げる処理（EnsureSize）

```csharp:line-numbers=90
        private void EnsureSize(IArrayPool<char>? bufferPool, int appendLength)
        {
            char[] newBuffer = BufferUtils.RentBuffer(bufferPool, (_position + appendLength) * 2);

            if (_buffer != null)
            {
                Array.Copy(_buffer, newBuffer, _position);
                BufferUtils.ReturnBuffer(bufferPool, _buffer);
            }

            _buffer = newBuffer;
        }
```

`EnsureSize` は、必要な長さの 2 倍の配列を借ります。古い配列の中身を新しい配列にコピーし、古い配列はプールに返します。最後に、新しい配列を使うように切り替えます。

### 具体例で確かめる

長さ 4 の配列に 5 文字目を書こうとすると、次のように進みます。

```
位置 4 = 配列の長さ 4 → いっぱい
EnsureSize: 新しい配列（(4 + 1) × 2 = 10 文字分）を借りる
古い 4 文字をコピーし、古い配列を返す
5 文字目を位置 4 に書き、位置を 5 にする
```

## ここがすごい

- **文字列を作り直さない**: 途中の文字列を何度も作らずに、同じ配列へ書き足します。
- **余裕を持って広げる**: 2 倍の大きさで借りるので、広げる回数が少なくなります。
- **配列を使い回す**: 古い配列を返すので、次の処理が同じ配列を借りられます。大きな配列の確保が減ります。
- **1 文字の処理が短い**: 通常の書き込みは、位置の確認と代入だけで済みます。広げる処理は、いっぱいのときだけ実行されます。

## まとめ

- `Append(char)` は、配列の書き込み位置に文字を入れ、位置を 1 つ進める。
- 配列がいっぱいのときは、`EnsureSize` が 2 倍の配列を借り、中身を移して古い配列を返す。
- 文字列の連結を避けて、メモリの確保と解放を減らしている。
