---
title: "数字を後ろから 2 桁ずつ、1 回の書き込みで埋めていく"
description: "整数を 10 進数の文字列にする UInt32ToDecChars。100 で割った余りを表で 2 文字に変え、char 2 つ分を 32 ビット値として 1 回で書く。桁数の偶奇で先頭の 1 桁を特別扱いする。"
language: csharp
project: ".NET Runtime"
repo: https://github.com/dotnet/runtime
license: MIT
copyright: "Copyright (c) .NET Foundation and Contributors"
commit: "f368d14df0c3905d3b80073d709685af83ba895d"
file: src/libraries/System.Private.CoreLib/src/System/Number.Formatting.cs
lines: [1771, 1795]
function: "Number.UInt32ToDecChars(uint, Span<char>)"
difficulty: 3
format: 2
tags: [文字列処理, 数値計算, 最適化]
---

## ひとことで

`UInt32ToDecChars` は、`uint` の値を **10 進数の文字列** として、用意されたバッファに書き込む関数です。`12345.ToString()` のような処理の中心にあります。

素直な方法は「10 で割った余りを 1 文字ずつ書く」ですが、この関数は **100 で割って 2 桁ずつ** 処理し、しかも 2 文字を **1 回のメモリ書き込み** で済ませます。

## コード

```csharp:line-numbers=1771
        [MethodImpl(MethodImplOptions.AggressiveInlining)]
        private static void UInt32ToDecChars(uint value, Span<char> buffer)
        {
            Debug.Assert(!buffer.IsEmpty);

            int leadingDigits = 2 - (buffer.Length & 1);
            Span<DigitPair> pairs = MemoryMarshal.Cast<char, DigitPair>(buffer.Slice(leadingDigits));

            for (int i = pairs.Length - 1; (uint)i < (uint)pairs.Length; i--)
            {
                (value, uint remainder) = Math.DivRem(value, 100);
                pairs[i] = new DigitPair(GetTwoDigitsChars(remainder));
            }

            if (leadingDigits == 1)
            {
                Debug.Assert(value < 10);
                buffer[0] = (char)(value + '0');
            }
            else
            {
                Debug.Assert(value < 100);
                WriteTwoDigits(value, buffer.Slice(0, 2));
            }
        }
```

## 前提知識

- **`Span<char>`**: 文字の並びへの「窓」です。ここでは、桁数ちょうどの長さで作られた文字列の中身を指しています。
- **`MemoryMarshal.Cast<char, DigitPair>(span)`**: 同じメモリを別の型の並びとして見直します。`char` は 2 バイト、`DigitPair` は 4 バイト（`uint` 1 つ）なので、char 2 つ分が DigitPair 1 つになります。コピーは起きません。
- **`DigitPair`**: 同じファイルで定義されている、`uint` を 1 つだけ持つ構造体です。`Pack = sizeof(char)` という指定で、char の並びの途中（2 バイト境界）に置いても正しく扱えるようにしています。
- **`Math.DivRem(value, 100)`**: 商と余りを同時に返します。タプル `(value, uint remainder) = ...` で 2 つの変数に受け取っています。
- **`GetTwoDigitsChars(n)`**: 0〜99 の数を、2 つの文字（UTF-16）を詰めた 32 ビット値に変える表引きです。
- **`buffer.Length & 1`**: 長さが奇数なら 1、偶数なら 0 です。

## 何をしているか

`value = 12345`（5 桁、`buffer` の長さは 5）で追います。

### 1. 先頭に何桁残すかを決める

```csharp:line-numbers=1776
            int leadingDigits = 2 - (buffer.Length & 1);
            Span<DigitPair> pairs = MemoryMarshal.Cast<char, DigitPair>(buffer.Slice(leadingDigits));
```

長さ 5 は奇数なので `leadingDigits = 2 - 1 = 1`。先頭の 1 文字を残し、後ろの 4 文字を DigitPair 2 つとして見ます。偶数桁なら先頭 2 文字を残します。

### 2. 後ろから 2 桁ずつ書く

```csharp:line-numbers=1779
            for (int i = pairs.Length - 1; (uint)i < (uint)pairs.Length; i--)
            {
                (value, uint remainder) = Math.DivRem(value, 100);
                pairs[i] = new DigitPair(GetTwoDigitsChars(remainder));
            }
```

- `12345 ÷ 100` → 商 123、余り **45** → 最後の DigitPair に `"45"` を書く
- `123 ÷ 100` → 商 1、余り **23** → その前の DigitPair に `"23"` を書く

ループの条件 `(uint)i < (uint)pairs.Length` は、`i` が −1 になると符号なしで巨大な数になって終わる、という書き方です。

### 3. 先頭の桁を書く

```csharp:line-numbers=1785
            if (leadingDigits == 1)
            {
                Debug.Assert(value < 10);
                buffer[0] = (char)(value + '0');
            }
            else
            {
                Debug.Assert(value < 100);
                WriteTwoDigits(value, buffer.Slice(0, 2));
            }
```

残った `value = 1` を `'1'` にして先頭に書きます。結果は `"12345"` です。

## ここがすごい

- **割り算の回数が半分**: 1 桁ずつだと 5 桁で 5 回割りますが、2 桁ずつなら 2〜3 回です。定数 100 での割り算は JIT が掛け算に置き換えるので、さらに速くなります。
- **2 文字を 1 回で書く**: 表には「`'4'` と `'5'` を並べた 4 バイト」があらかじめ入っているので、1 回の 32 ビット書き込みで 2 文字が埋まります。1 文字ずつ書くより書き込みの回数が半分です。
- **偶奇で先頭を調整**: 桁数が奇数でも偶数でも、後ろ側は必ず 2 文字ずつのペアになるよう、先頭の 1 桁か 2 桁を別に扱っています。こうするとループの中に「残り 1 桁か？」の判定が要りません。
- **桁数を先に知っている**: 呼び出し元は `FormattingHelpers.CountDigits` でぴったりの長さの文字列を作ってから、この関数を呼びます。だから後ろから書いていっても、最後に文字を前に詰め直す必要がありません。

## まとめ

- 数値の文字列化は、100 で割って 2 桁ずつ表を引くと速い。
- 2 文字を 1 つの 32 ビット値として書くと、メモリへの書き込みが半分になる。
- 先に桁数を数えておけば、後ろから書いても無駄なコピーが要らない。
