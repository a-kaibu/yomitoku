---
title: "通し番号を、配列の中の位置（バイト数）へ直す"
description: "JCTools の UnsafeRefArrayAccess.calcCircularRefElementOffset。増え続ける番号を、マスクで円形の添字にし、要素の大きさを掛けて、Unsafe で使うバイト位置を求める。"
language: java
project: JCTools
repo: https://github.com/JCTools/JCTools
license: Apache-2.0
copyright: "Copyright JCTools contributors"
commit: "6d497fc79fcf44dc3c301ac813f3615fabb3a444"
file: jctools-core/src/main/java/org/jctools/util/UnsafeRefArrayAccess.java
lines: [108, 111]
function: "UnsafeRefArrayAccess.calcCircularRefElementOffset"
difficulty: 2
format: 2
tags: [データ構造, 低レイヤ, ビット演算]
---

## ひとことで

JCTools のキューは、配列を円形に使います。読み書きの位置を表す番号（`index`）は、どんどん増えていきますが、配列の添字は範囲の中に収めなければなりません。

`calcCircularRefElementOffset` は、その番号から、配列の中の位置をバイト数で求めます。`Unsafe` という低レベルの API は、添字ではなくバイト位置で要素を読み書きするので、この計算が必要になります。

## コード

```java:line-numbers=108
    public static long calcCircularRefElementOffset(long index, long mask)
    {
        return REF_ARRAY_BASE + ((index & mask) << REF_ELEMENT_SHIFT);
    }
```

## 前提知識

- **円形のバッファ（ring buffer）**: 配列の末尾まで来たら、先頭に戻って使う仕組みです。番号を配列の長さで割った余りが、配列の添字になります。
- **マスク（mask）**: 配列の長さが 2 の累乗なら、`length - 1` のビットが全部 1 になります。`index & mask` で、割り算なしに余りを求められます。
- **`Unsafe` のオフセット**: Java の配列は、先頭にヘッダがあります。`Unsafe` では、ヘッダの後ろから数えたバイト位置で要素を指定します。
- **`REF_ELEMENT_SHIFT`**: 1 つの参照のバイト数を 2 の何乗かで表した値です。コードの初期化部分では、4 バイトなら 2、8 バイトなら 3 になります。

## 何をしているか

### 1. 番号を配列の長さの中に収める

```java:line-numbers=110
        return REF_ARRAY_BASE + ((index & mask) << REF_ELEMENT_SHIFT);
```

`index & mask` で、増え続ける番号を、円形の配列の添字に直します。`mask` は長さ − 1 なので、長さの範囲に収まります。

### 2. 添字をバイト位置にして、先頭を足す

```java:line-numbers=110
        return REF_ARRAY_BASE + ((index & mask) << REF_ELEMENT_SHIFT);
```

`<< REF_ELEMENT_SHIFT` は、添字に要素の大きさを掛けたものです。そこへ `REF_ARRAY_BASE`（配列の先頭のバイト位置）を足すと、その要素のバイト位置になります。

同じ形の `calcRefElementOffset(index)` は、マスクを掛けない版です。番号を配列の中に収めるのは、呼び出し側の役目になります。

## ここがすごい

- **割り算を使わない**: 円形の添字を、`&` 1 回で求めます。キューの読み書きは頻繁に行われるので、この 1 回の軽さが効きます。
- **シフトで掛け算**: 要素の大きさは 2 の累乗なので、掛け算を左シフトで済ませています。
- **ビットの数を初期化で決める**: `REF_ELEMENT_SHIFT` は起動時に 1 回だけ決まり、その後は計算に使うだけです。実行中に、ポインタの大きさを調べ直す必要はありません。
- **番号が溢れても、位置は正しい**: 番号は増え続けますが、マスクで円形に戻るので、配列の外を指すことはありません。

## まとめ

- `calcCircularRefElementOffset` は、番号をマスクで円形の添字にし、要素の大きさを掛けてバイト位置を求める。
- 配列の長さは 2 の累乗なので、`& mask` だけで範囲に収まり、割り算が要らない。
- `Unsafe` のバイト位置は、配列の先頭の位置（`REF_ARRAY_BASE`）を足して求める。
