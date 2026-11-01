---
title: "割り算 1 回で「商」と「その桁の文字」を同時に作る"
description: "WriteDigits は、値を決まった桁数の 10 進数として右から書く。'0' を先に足してから 10 で割り、引き算で余りの文字を求めることで、% 演算子を使わずに済ませている。"
language: csharp
project: ".NET Runtime"
repo: https://github.com/dotnet/runtime
license: MIT
copyright: "Copyright (c) .NET Foundation and Contributors"
commit: "f368d14df0c3905d3b80073d709685af83ba895d"
file: src/libraries/System.Private.CoreLib/src/System/Number.Formatting.cs
lines: [1962, 1975]
function: "Number.WriteDigits<TChar>"
difficulty: 2
tags: [文字列処理, 数値計算, ハック]
---

## ひとことで

`WriteDigits(value, destination)` は、数値 `value` を **ちょうど `destination.Length` 桁** の 10 進数として書き込む関数です。足りない桁は 0 で埋まります。長さ 4 のバッファに 42 を書けば `"0042"` になります。日時の書式化などで使われます。

1 桁ずつ右から書いていく素直な方法ですが、**余りを求める `%` を使わず、`'0'` を先に足す** というちょっとした工夫があります。

## コード

```csharp:line-numbers=1962
        /// <summary>Writes exactly <c>destination.Length</c> digits for <paramref name="value"/> into <paramref name="destination"/>.</summary>
        [MethodImpl(MethodImplOptions.AggressiveInlining)]
        internal static void WriteDigits<TChar>(uint value, Span<TChar> destination) where TChar : unmanaged, IUtfChar<TChar>
        {
            int cur = destination.Length - 1;
            while (cur > 0)
            {
                uint temp = '0' + value;
                value /= 10;
                destination[cur--] = TChar.CastFrom(temp - value * 10);
            }
            Debug.Assert(value < 10);
            destination[0] = TChar.CastFrom('0' + value);
        }
```

## 前提知識

- **`Span<TChar> destination`**: 書き込み先の文字の並びです。`TChar` は `char`（UTF-16）か `byte`（UTF-8）で、ジェネリクスで両方に対応しています。
- **`TChar.CastFrom(x)`**: 数値 `x` を `TChar` 型の文字に変換する静的メソッドです（`IUtfChar<TChar>` インターフェイスで定義）。C# 11 以降、インターフェイスに static なメンバーを定義でき、ジェネリクスから呼べるようになりました。
- **`'0' + value`**: 文字 `'0'` は数値 48 なので、`'0' + 7` は 55 = `'7'` です。数字の文字は `'0'` から順に並んでいます。
- **`destination[cur--] = ...`**: `cur` の位置に書いてから、`cur` を 1 減らします（後置デクリメント）。
- **`value /= 10`**: `value = value / 10` の短縮形です。整数の割り算なので切り捨てです。

## 何をしているか

長さ 4 の `destination` に `value = 42` を書く場合です。

| cur | temp = '0' + value | value /= 10 | 書く文字 = temp − value × 10 |
| --- | --- | --- | --- |
| 3 | 48 + 42 = 90 | 4 | 90 − 40 = 50 = `'2'` |
| 2 | 48 + 4 = 52 | 0 | 52 − 0 = 52 = `'4'` |
| 1 | 48 + 0 = 48 | 0 | 48 = `'0'` |

ループを抜けたら、残った `value`（0）を `'0' + 0` として先頭に書きます。結果は `"0042"` です。

## ここがすごい

- **% を使わない**: ふつうは `'0' + value % 10` と `value / 10` の 2 回、割り算系の演算をします。この関数は `value / 10` の 1 回だけで、余りは「元の値 − 商 × 10」という掛け算と引き算で求めます。定数 10 での割り算は JIT が掛け算に置き換えますが、それでも `/` と `%` を別々に書くより命令が減ります。
- **'0' を先に足しておく**: `temp = '0' + value` としておけば、`temp − 商 × 10` がそのまま「余りの文字」になります。「余りを求めてから '0' を足す」という足し算を 1 回省けます。小さな工夫ですが、書式化のように何度も呼ばれる場所では効きます。
- **最後の桁はループの外**: 先頭の桁（`cur == 0`）ではもう割る必要がないので、ループの外で `'0' + value` を書くだけにしています。1973 行目の `Debug.Assert(value < 10)` で、「桁数が足りない値を渡していない」ことを確かめています。

## まとめ

- 余りは「元の値 − 商 × 割る数」でも求められる。割り算を 1 回にできる。
- 先に `'0'` を足しておくと、余りの計算結果がそのまま文字になる。
- 前提（値が桁数に収まること）は Debug.Assert で確かめておく。
