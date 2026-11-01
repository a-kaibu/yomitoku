---
title: "バイト数の値が、扱える範囲に収まるかを調べる"
description: "Humanizer の ByteSize の IsSupportedUnitValue。値とその単位を掛けた結果が有限で、扱える範囲に入るかを調べる。範囲外の値を早めに弾く。"
language: csharp
project: "Humanizer"
repo: https://github.com/Humanizr/Humanizer
license: MIT
copyright: "Copyright (c) .NET Foundation and Contributors"
commit: "4574b93883bf48e3f0f3bca73297054537317ab2"
file: src/Humanizer/Bytes/ByteSize.cs
lines: [1807, 1813]
function: "ByteSize.IsSupportedUnitValue(double, double)"
difficulty: 2
format: 2
tags: [数値計算, 防御的プログラミング, 型システム]
---

## ひとことで

`IsSupportedUnitValue` は、単位つきの値（たとえば「3 メビバイト」）が、`ByteSize` で **扱える範囲に入るか** を調べる関数です。
値に単位を掛けてバイト数にし、それが有限の数で、範囲に入っているかを確かめます。

範囲外の値は、`ByteSize` を作る前に例外で弾くために使われます。

## コード

```csharp:line-numbers=1807
    static bool IsSupportedUnitValue(double value, double bytesPerUnit)
    {
        var bytes = value * bytesPerUnit;
        return double.IsFinite(bytes) &&
            bytes >= -BytesInPebibyte * 1024d &&
            bytes < BytesInPebibyte * 1024d;
    }
```

## 前提知識

- **`double`**: 小数を表す型です。`double.IsFinite` は、無限大（∞）や NaN（数でないこと）でないかを調べます。
- **`BytesInPebibyte`**: 1 ペビバイト（2 の 50 乗バイト）を表す定数です。
- **`1024d`**: 小数の 1024 を表します。`d` は `double` 型の数であることを示す書き方です。
- **論理積（`&&`）**: 両方が `true` のときだけ `true` になる書き方です。

## 何をしているか

### 1. バイト数に直す

```csharp:line-numbers=1809
        var bytes = value * bytesPerUnit;
```

`value * bytesPerUnit` で、単位つきの値をバイト数に直します。たとえば「3 キビバイト」なら、3 に 1024 を掛けます。

### 2. 有限の数かを調べる

```csharp:line-numbers=1810
        return double.IsFinite(bytes) &&
```

`double.IsFinite` で、無限大や NaN ではないことを確かめます。こうした値は、そのあとの比較の意味がなくなるので、先に弾きます。

### 3. 範囲に入っているかを調べる

```csharp:line-numbers=1811
            bytes >= -BytesInPebibyte * 1024d &&
            bytes < BytesInPebibyte * 1024d;
```

`-2 の 60 乗` 以上、`2 の 60 乗` 未満かを調べます。`BytesInPebibyte * 1024` は 2 の 60 乗（約 1 エクスビバイト）です。この範囲に入っていれば、`ByteSize` の内部で扱える値です。

## ここがすごい

- **先に弾く**: 無限大や範囲外の値を、計算の途中で壊れる前に検出します。
- **範囲の上下を分けて書く**: 負の値も扱えるように、下限は `>=` で、上限は `<` で書いています。
- **定数で範囲を表す**: 数の代わりに `BytesInPebibyte` という名前の定数を使うので、意味が読み取りやすくなっています。

## まとめ

- 単位を掛けて、バイト数に直す。
- 無限大や NaN を、先に弾く。
- 範囲の中に入っていれば、扱える値とみなす。
