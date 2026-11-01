---
title: "2 つの 32 ビットの値を、足し算・XOR・回転で混ぜる"
description: ".NET の Marvin ハッシュの中心となる Block 関数。2 つの uint を、足し算、排他的論理和（XOR）、ビット回転を交互に使って混ぜ合わせ、入力の小さな違いを全体に広げる。"
language: csharp
project: ".NET Runtime"
repo: https://github.com/dotnet/runtime
license: MIT
copyright: "Copyright (c) .NET Foundation and Contributors"
commit: "f368d14df0c3905d3b80073d709685af83ba895d"
file: src/libraries/System.Private.CoreLib/src/System/Marvin.cs
lines: [224, 244]
function: "Marvin.Block(ref uint, ref uint)"
difficulty: 3
format: 2
tags: [ハッシュ, ビット演算, 低レイヤ]
---

## ひとことで

`Block` は、2 つの 32 ビットの値を **ぐちゃぐちゃに混ぜ合わせる** 関数です。
入力の 1 ビットが違うだけで、出力のビットが大きく変わるようにします。これは、ハッシュ値を作る処理の中心的な部品です。

.NET の `string` の `GetHashCode` は、この仕組み（Marvin ハッシュ）で値を計算しています。

## コード

::: code-group

```csharp:line-numbers=224 [日本語訳]
        private static void Block(ref uint rp0, ref uint rp1)
        {
            // Mono のインタプリタでは、この処理を組み込みの命令に置き換えて高速化している。
            uint p0 = rp0;
            uint p1 = rp1;

            p1 ^= p0;
            p0 = RotateLeft(p0, 20);

            p0 += p1;
            p1 = RotateLeft(p1, 9);

            p1 ^= p0;
            p0 = RotateLeft(p0, 27);

            p0 += p1;
            p1 = RotateLeft(p1, 19);

            rp0 = p0;
            rp1 = p1;
        }
```

```csharp:line-numbers=224 [原文]
        private static void Block(ref uint rp0, ref uint rp1)
        {
            // Intrinsified in mono interpreter
            uint p0 = rp0;
            uint p1 = rp1;

            p1 ^= p0;
            p0 = RotateLeft(p0, 20);

            p0 += p1;
            p1 = RotateLeft(p1, 9);

            p1 ^= p0;
            p0 = RotateLeft(p0, 27);

            p0 += p1;
            p1 = RotateLeft(p1, 19);

            rp0 = p0;
            rp1 = p1;
        }
```

:::

## 前提知識

- **ハッシュ**: 値から、ばらついた数値を作る計算です。同じ入力からは、いつも同じ結果が出ます。
- **排他的論理和（XOR, `^`）**: 桁ごとに、2 つの値が違うときだけ 1 にする演算です。
- **ビット回転（`RotateLeft`）**: ビットを左へずらし、はみ出した分を右の端へ戻す操作です。値のどの桁も失われません。
- **`ref` 引数**: 呼び出し元の変数そのものを書き換えるための引数です。`rp0`, `rp1` の値が、この関数で更新されます。
- **ARX**: 足し算（Add）、回転（Rotate）、XOR を組み合わせた、ハッシュや暗号でよく使われる混ぜ方です。

## 何をしているか

### 1. 最初の混ぜ合わせ

```csharp:line-numbers=227
            uint p0 = rp0;
            uint p1 = rp1;

            p1 ^= p0;
            p0 = RotateLeft(p0, 20);
```

`p1` を `p0` と XOR し、`p0` を 20 ビット回転します。XOR で 2 つの値が絡み合い、回転で桁の位置が入れ替わります。

### 2. 足し算と回転

```csharp:line-numbers=233
            p0 += p1;
            p1 = RotateLeft(p1, 9);
```

`p0` に `p1` を足し、`p1` を 9 ビット回転します。足し算では、下の桁の繰り上がりが上の桁へ伝わります。

### 3. さらに XOR と回転

```csharp:line-numbers=236
            p1 ^= p0;
            p0 = RotateLeft(p0, 27);
```

もう一度 XOR してから、`p0` を 27 ビット回転します。

### 4. 最後の足し算と回転

```csharp:line-numbers=239
            p0 += p1;
            p1 = RotateLeft(p1, 19);

            rp0 = p0;
            rp1 = p1;
```

`p0` に `p1` を足し、`p1` を 19 ビット回転します。結果を `ref` の引数へ書き戻します。

## ここがすごい

- **少ない命令で混ぜる**: 足し算、XOR、回転の 3 種類だけで、高速に実行できます。
- **桁の位置を入れ替える**: 回転で、ある桁の影響が別の桁へ移ります。1 ビットの違いが全体に広がる理由です。
- **回転の数を変えている**: 20, 9, 27, 19 と毎回違う回数だけ回すので、同じ桁の入れ替えが単純に繰り返されません。
- **ref で値を直接更新**: 戻り値の組を作らずに、2 つの値を書き換えるので、余分な処理がありません。

## まとめ

- `Block` は、足し算・XOR・ビット回転で 2 つの値を混ぜる。
- 1 ビットの違いが、出力の多くのビットに広がるように作られている。
- この関数は、文字列の `GetHashCode` で使われる Marvin ハッシュの中心部品である。
