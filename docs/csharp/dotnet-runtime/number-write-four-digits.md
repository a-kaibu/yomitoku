---
title: "4 桁の数字を、2 桁ずつ 2 回に分けて書き出す"
description: ".NET の Number.WriteFourDigits。0〜9999 の数を 100 で割って上の 2 桁と下の 2 桁に分け、それぞれを 2 桁の文字として書く。数の文字列化を速くするための小さな工夫。"
language: csharp
project: ".NET Runtime"
repo: https://github.com/dotnet/runtime
license: MIT
copyright: "Copyright (c) .NET Foundation and Contributors"
commit: "f368d14df0c3905d3b80073d709685af83ba895d"
file: src/libraries/System.Private.CoreLib/src/System/Number.Formatting.cs
lines: [1953, 1960]
function: "Number.WriteFourDigits<TChar>(uint, Span<TChar>)"
difficulty: 2
format: 2
tags: [数値計算, 最適化, 標準ライブラリ]
---

## ひとことで

`WriteFourDigits` は、0〜9999 の整数を **ちょうど 4 桁の文字** として、書き込み先の領域に書き出す関数です。
たとえば `1234` なら `'1'`, `'2'`, `'3'`, `'4'` の 4 文字を書きます。

数を 1 桁ずつ割り算して取り出す代わりに、**100 で割って 2 桁ずつ** 書くことで、割り算の回数を減らしています。

## コード

```csharp:line-numbers=1953
        [MethodImpl(MethodImplOptions.AggressiveInlining)]
        internal static void WriteFourDigits<TChar>(uint value, Span<TChar> destination) where TChar : unmanaged, IUtfChar<TChar>
        {
            Debug.Assert(destination.Length >= 4);
            (value, uint remainder) = Math.DivRem(value, 100);
            WriteTwoDigits(value, destination.Slice(0, 2));
            WriteTwoDigits(remainder, destination.Slice(2, 2));
        }
```

## 前提知識

- **桁（けた）**: 数字の位置です。`1234` の 4 桁は、千・百・十・一の位です。
- **`/` と `%`**: `/` は割り算の商、`%` は余りを求めます。`1234 / 100` は `12`、`1234 % 100` は `34` です。
- **`Span<TChar>`**: 文字の並びを、コピーせずに直接指す型です。`destination.Slice(0, 2)` で先頭 2 要素だけを指せます。
- **`TChar`（ジェネリクス）**: UTF-8 のバイトでも UTF-16 の文字でも使えるように、文字の型を後から決める書き方です。
- **`Debug.Assert`**: 開発中だけ確認する条件です。本番のビルドでは実行されません。

## 何をしているか

### 1. 100 で割って、上の 2 桁と下の 2 桁に分ける

```csharp:line-numbers=1957
            (value, uint remainder) = Math.DivRem(value, 100);
```

`Math.DivRem(value, 100)` は、商と余りを 1 回の呼び出しで返します。`1234` なら、商が `12`、余りが `34` です。

### 2. 上の 2 桁を書く

```csharp:line-numbers=1958
            WriteTwoDigits(value, destination.Slice(0, 2));
```

商の `12` を、先頭の 2 文字として書きます。`WriteTwoDigits` は、0〜99 の数を 2 桁で書くための別の関数です。

### 3. 下の 2 桁を書く

```csharp:line-numbers=1959
            WriteTwoDigits(remainder, destination.Slice(2, 2));
```

余りの `34` を、残りの 2 文字として書きます。`destination.Slice(2, 2)` で、3 文字目と 4 文字目だけを指しています。

## ここがすごい

- **割り算は 1 回で済む**: `DivRem` で商と余りを同時に求めるので、割り算を 2 回書かずに済みます。
- **2 桁ずつ書く**: 1 桁ずつ書く `WriteDigits` より、関数の呼び出しや割り算の数が少なくなります。
- **書き込み先を切り分ける**: `Slice` で書く場所を指定するので、配列の境界を越えて書く心配がありません。
- **ジェネリクスで型を変える**: 同じコードが、UTF-8 と UTF-16 の両方で動きます。文字列を作るための無駄なコピーを減らせます。

## まとめ

- 4 桁の数字は、100 で割って上と下の 2 桁に分けると書きやすい。
- `DivRem` で商と余りを 1 回で求め、それぞれを 2 桁ずつ書く。
- `Span` と `Slice` を使うと、書き込み先の場所を安全に指定できる。
