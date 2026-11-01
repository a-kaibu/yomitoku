---
title: "「1 つだけ 1 がある」を、1 を引いて AND する 1 行で判定する"
description: "BitOperations.IsPow2(int)。2 のべき乗は 2 進数で 1 つしか 1 が無いことを使い、value と value - 1 の AND が 0 になるかで判定する。ハッシュ表の大きさ確認などで使われる定番のビットハック。"
language: csharp
project: ".NET Runtime"
repo: https://github.com/dotnet/runtime
license: MIT
copyright: "Copyright (c) .NET Foundation and Contributors"
commit: "f368d14df0c3905d3b80073d709685af83ba895d"
file: src/libraries/System.Private.CoreLib/src/System/Numerics/BitOperations.cs
lines: [44, 49]
function: "BitOperations.IsPow2(int)"
difficulty: 1
format: 2
tags: [ビット演算, ハック, イディオム]
---

## ひとことで

\`IsPow2(value)\` は、整数が **2 のべき乗**（1, 2, 4, 8, 16, …）かどうかを返します。
たとえば \`8\` は true、\`6\` は false です。0 と負の数は false になります。

ループや割り算を使わず、**引き算と AND の 1 行** で判定できるのが特徴です。

## コード

::: code-group

```csharp:line-numbers=44 [日本語訳]
        /// <summary>
        /// 与えられた整数値が 2 のべき乗かどうかを判定する。
        /// </summary>
        /// <param name="value">値。</param>
        [MethodImpl(MethodImplOptions.AggressiveInlining)]
        public static bool IsPow2(int value) => (value & (value - 1)) == 0 && value > 0;
```

```csharp:line-numbers=44 [原文]
        /// <summary>
        /// Evaluate whether a given integral value is a power of 2.
        /// </summary>
        /// <param name="value">The value.</param>
        [MethodImpl(MethodImplOptions.AggressiveInlining)]
        public static bool IsPow2(int value) => (value & (value - 1)) == 0 && value > 0;
```

:::

## 前提知識

- **2 進数**: 数を 2 のべきで表す書き方です。\`8\` は \`1000\`、\`6\` は \`0110\` です。
- **2 のべきの形**: 2 のべき乗の数は、2 進数で「1 が 1 つだけで、残りは 0」の形をしています。
- **\`value - 1\`**: 1 を引くと、一番下の 1 が 0 になり、その右側の 0 がすべて 1 になります。例: \`1000 - 1 = 0111\`。
- **\`&\`（AND）**: 桁ごとに両方が 1 のときだけ 1 にします。
- **\`value > 0\`**: 0 以下を除外します。0 は \`(0 & -1) == 0\` となり、AND の判定だけでは true になってしまうからです。

## 何をしているか

### 1. 2 のべきの場合

```csharp:line-numbers=49
        public static bool IsPow2(int value) => (value & (value - 1)) == 0 && value > 0;
```

\`value = 8\`（\`1000\`）で追います。

\`\`\`
value      = 1000
value - 1  = 0111
AND        = 0000  → 0 なので true
\`\`\`

1 が 1 つだけの数から 1 を引くと、その 1 が消えて、下がすべて 1 になります。だから AND は必ず 0 になります。

### 2. 2 のべきでない場合

\`value = 6\`（\`0110\`）で追います。

\`\`\`
value      = 0110
value - 1  = 0101
AND        = 0100  → 4 なので false
\`\`\`

1 が 2 つ以上あると、1 を引いても一部の 1 が残るので、AND は 0 になりません。

### 3. 0 と負の数を除く

判定の後ろの \`&& value > 0\` が、0 や負の数を除きます。

## ここがすごい

- **1 回の AND で済む**: 2 のべきかどうかを、桁数を数えたり割り算したりせずに判定できます。CPU にとっては、引き算 1 回と AND 1 回です。
- **数学的に正しい**: 1 が 1 つだけの数でなければ、1 を引いても AND は必ず 0 にならない、という性質を利用しています。
- **0 の扱いを明示**: 0 は AND の判定だけでは true になってしまうので、\`value > 0\` で明示的に除いています。ビットハックは、こうした境界を忘れると誤判定の原因になります。
- **\`AggressiveInlining\`**: 小さな式なので、呼び出し元に展開されて、判定のための関数呼び出しが残りません。

## まとめ

- 2 のべき乗は「1 が 1 つだけ」なので、\`x & (x - 1)\` が 0 になる。
- 0 は判定の例外になるので、別に除く必要がある。
- ビットの性質を知ると、ループや割り算なしで判定できる。
