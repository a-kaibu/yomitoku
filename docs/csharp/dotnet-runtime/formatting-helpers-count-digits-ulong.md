---
title: "log2 から 10 のべき乗を引いて桁数を 1 回の比較で決める"
description: "ulong の 10 進桁数を求める CountDigits。fmt ライブラリ由来の手法で、log2 の値から候補の桁数を表で引き、10 のべき乗と 1 回比べるだけで答えを出す。"
language: csharp
project: ".NET Runtime"
repo: https://github.com/dotnet/runtime
license: MIT
copyright: "Copyright (c) .NET Foundation and Contributors"
commit: "f368d14df0c3905d3b80073d709685af83ba895d"
file: src/libraries/System.Private.CoreLib/src/System/Buffers/Text/FormattingHelpers.CountDigits.cs
lines: [14, 61]
function: "FormattingHelpers.CountDigits(ulong)"
difficulty: 2
format: 2
tags: [数値計算, 最適化, ビット演算]
---

## ひとことで

`CountDigits(ulong)` は、64 ビットの符号なし整数を 10 進数で書いたときの **桁数** を返します。
`0` や `9` なら 1、`12345` なら 5、`ulong` の最大値（`18446744073709551615`）なら 20 です。

素直に書くと最大 20 回の割り算か比較が必要ですが、この関数は **2 回の表引きと 1 回の比較** だけで答えを出します。数値を文字列にする処理（`ToString()` など）の中で、バッファの長さを決めるのに使われます。

## コード

::: code-group

```csharp:line-numbers=14 [日本語訳]
        [MethodImpl(MethodImplOptions.AggressiveInlining)]
        public static int CountDigits(ulong value)
        {
            // log2(value) を 10 のべき乗の指数に対応させる。
            ReadOnlySpan<byte> log2ToPow10 =
            [
                1,  1,  1,  2,  2,  2,  3,  3,  3,  4,  4,  4,  4,  5,  5,  5,
                6,  6,  6,  7,  7,  7,  7,  8,  8,  8,  9,  9,  9,  10, 10, 10,
                10, 11, 11, 11, 12, 12, 12, 13, 13, 13, 13, 14, 14, 14, 15, 15,
                15, 16, 16, 16, 16, 17, 17, 17, 18, 18, 18, 19, 19, 19, 19, 20
            ];
            Debug.Assert(log2ToPow10.Length == 64);

            nint elementOffset = log2ToPow10[(int)ulong.Log2(value)];

            // 対応する 10 のべき乗を読む。
            ReadOnlySpan<ulong> powersOf10 =
            [
                0, // 使わない要素（引き算を避けるため）
                0,
                10,
                100,
                1000,
                10000,
                100000,
                1000000,
                10000000,
                100000000,
                1000000000,
                10000000000,
                100000000000,
                1000000000000,
                10000000000000,
                100000000000000,
                1000000000000000,
                10000000000000000,
                100000000000000000,
                1000000000000000000,
                10000000000000000000,
            ];
            Debug.Assert((elementOffset + 1) <= powersOf10.Length);
            ulong powerOf10 = Unsafe.Add(ref MemoryMarshal.GetReference(powersOf10), elementOffset);

            // 10 のべき乗から桁数を求め、
            // しきい値を下回るなら 1 減らす。
            int index = (int)elementOffset;
            return index - (value < powerOf10 ? 1 : 0);
        }
```

```csharp:line-numbers=14 [原文]
        [MethodImpl(MethodImplOptions.AggressiveInlining)]
        public static int CountDigits(ulong value)
        {
            // Map the log2(value) to a power of 10.
            ReadOnlySpan<byte> log2ToPow10 =
            [
                1,  1,  1,  2,  2,  2,  3,  3,  3,  4,  4,  4,  4,  5,  5,  5,
                6,  6,  6,  7,  7,  7,  7,  8,  8,  8,  9,  9,  9,  10, 10, 10,
                10, 11, 11, 11, 12, 12, 12, 13, 13, 13, 13, 14, 14, 14, 15, 15,
                15, 16, 16, 16, 16, 17, 17, 17, 18, 18, 18, 19, 19, 19, 19, 20
            ];
            Debug.Assert(log2ToPow10.Length == 64);

            nint elementOffset = log2ToPow10[(int)ulong.Log2(value)];

            // Read the associated power of 10.
            ReadOnlySpan<ulong> powersOf10 =
            [
                0, // unused entry to avoid needing to subtract
                0,
                10,
                100,
                1000,
                10000,
                100000,
                1000000,
                10000000,
                100000000,
                1000000000,
                10000000000,
                100000000000,
                1000000000000,
                10000000000000,
                100000000000000,
                1000000000000000,
                10000000000000000,
                100000000000000000,
                1000000000000000000,
                10000000000000000000,
            ];
            Debug.Assert((elementOffset + 1) <= powersOf10.Length);
            ulong powerOf10 = Unsafe.Add(ref MemoryMarshal.GetReference(powersOf10), elementOffset);

            // Return the number of digits based on the power of 10, shifted by 1
            // if it falls below the threshold.
            int index = (int)elementOffset;
            return index - (value < powerOf10 ? 1 : 0);
        }
```

:::

## 前提知識

- **`ulong`**: 64 ビット符号なし整数です。0 から約 1844 京まで表せます。
- **`ulong.Log2(value)`**: 一番上の 1 のビットの位置（0〜63）を返します。CPU の命令 1 個で計算できます。
- **`nint`**: ポインタと同じ幅の整数（64 ビット環境なら 64 ビット）です。配列の位置（オフセット）を表すときによく使います。
- **`Unsafe.Add(ref MemoryMarshal.GetReference(span), i)`**: Span の先頭要素への参照を取り、そこから i 個先の要素を読みます。普通の `span[i]` と違って **範囲チェックをしません**。
- **三項演算子 `a ? b : c`**: a が真なら b、偽なら c です。`(value < powerOf10 ? 1 : 0)` は比較結果を 0 か 1 にしています。
- **`ReadOnlySpan<byte> x = [ ... ];`**: 定数の表です。実行のたびに配列を作らず、DLL のデータを直接参照します。

## 何をしているか

### 1. log2 から「多めに見積もった桁数」を引く

```csharp:line-numbers=18
            ReadOnlySpan<byte> log2ToPow10 =
            [
                1,  1,  1,  2,  2,  2,  3,  3,  3,  4,  4,  4,  4,  5,  5,  5,
                6,  6,  6,  7,  7,  7,  7,  8,  8,  8,  9,  9,  9,  10, 10, 10,
                10, 11, 11, 11, 12, 12, 12, 13, 13, 13, 13, 14, 14, 14, 15, 15,
                15, 16, 16, 16, 16, 17, 17, 17, 18, 18, 18, 19, 19, 19, 19, 20
            ];
            Debug.Assert(log2ToPow10.Length == 64);

            nint elementOffset = log2ToPow10[(int)ulong.Log2(value)];
```

2 進数で k+1 桁（log2 = k）の数は、10 進数では 2 通りの桁数のどちらかです。表 `log2ToPow10` には、そのうち **大きいほうの桁数** が入っています。

`value = 99` の場合、2 進数は `1100011` なので log2 = 6、表の 6 番目は **3** です（64〜127 は 2 桁か 3 桁）。

### 2. 対応する 10 のべき乗を引く

```csharp:line-numbers=30
            ReadOnlySpan<ulong> powersOf10 =
            [
                0, // 使わない要素（引き算を避けるため）
                0,
                10,
                100,
                1000,
                10000,
                100000,
                1000000,
                10000000,
                100000000,
                1000000000,
                10000000000,
                100000000000,
                1000000000000,
                10000000000000,
                100000000000000,
                1000000000000000,
                10000000000000000,
                100000000000000000,
                1000000000000000000,
                10000000000000000000,
            ];
            Debug.Assert((elementOffset + 1) <= powersOf10.Length);
            ulong powerOf10 = Unsafe.Add(ref MemoryMarshal.GetReference(powersOf10), elementOffset);
```

`powersOf10[n]` には「n 桁の最小値」、つまり 10ⁿ⁻¹ が入っています。`powersOf10[3]` は `100` です。
コメントの通り、先頭に使わない 0 を 1 つ置いて、`n - 1` の引き算を省いています。

### 3. 1 回だけ比べる

```csharp:line-numbers=59
            int index = (int)elementOffset;
            return index - (value < powerOf10 ? 1 : 0);
```

`value < 100` なら、見積もりより 1 桁少ないので `3 - 1 = 2`。`value = 100` なら `3` のまま。

`value = 0` のときは log2 が 0、表の値は 1、`powersOf10[1]` は 0 です。`0 < 0` は偽なので、正しく 1 桁になります。2 番目の要素に 0 を入れているのは、この 0 と 1〜9 をまとめて扱うためです。

## ここがすごい

- **2 進の桁数と 10 進の桁数の関係を使う**: 2³ ≒ 10 なので、2 進数で 3〜4 桁増えるごとに 10 進数は 1 桁増えます。この「ずれ」を表にしておけば、候補は常に 2 つに絞れ、比較は 1 回で済みます。
- **配列に番兵を置いて引き算を消す**: 先頭の未使用要素で添字の計算を 1 つ減らしています。小さなことですが、数値の文字列化はとても頻繁に呼ばれるので効きます。
- **範囲チェックの省略を Assert で裏付け**: `Debug.Assert` で「添字が範囲内である」ことをデバッグ時に確かめたうえで、本番では `Unsafe.Add` によってチェックを外しています。
- **出典がコメントに**: 関数の直前のコメントに、元になった C++ の fmt ライブラリの該当行への固定リンクがあります。

## まとめ

- log2 がわかれば、10 進数の桁数の候補は 2 つに絞れる。
- 表の先頭に番兵を置くと、添字計算を省ける。
- 「速いが安全確認をしない」API は、Assert などで前提を明示して使う。
