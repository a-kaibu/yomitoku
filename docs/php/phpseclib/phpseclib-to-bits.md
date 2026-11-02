---
title: 大きな整数を、2 進数の文字列にする
description: phpseclib の BigInteger の toBits は、任意の大きさの整数を、0 と 1 だけの文字列に変えます。精度が決まっていれば、その桁数に合わせます。2 の補数の形で書くときは、正の数の先頭に 0 を付けて、符号のビットと区別します。
language: php
project: phpseclib
repo: https://github.com/phpseclib/phpseclib
license: MIT
copyright: Copyright (c) 2011-2026 TerraFrost and other contributors
commit: "694f9b2336a4923f86ce7c69ad5ab480ff97728b"
file: phpseclib/Math/BigInteger/Engines/Engine.php
lines: [260, 272]
function: toBits
difficulty: 3
format: 2
tags: [数値計算, ビット演算, 暗号]
---
## ひとことで

`toBits` は、PHP の整数の範囲を超えて大きくなる数を、2 進数の桁が並んだ文字列にする関数です。暗号の計算では、鍵や数字をビットの列として扱う場面が多くあります。その元になる文字列を、この関数が作ります。

## コード

```php:line-numbers=260
    public function toBits(bool $twos_compliment = false): string
    {
        $hex = $this->toBytes($twos_compliment);
        $bits = Strings::bin2bits($hex);

        $result = $this->precision > 0 ? substr($bits, -$this->precision) : ltrim($bits, '0');

        if ($twos_compliment && $this->compare(new static()) > 0 && $this->precision <= 0) {
            return '0' . $result;
        }

        return $result;
    }
```

## 前提知識

- **任意精度の整数（BigInteger）**: PHP の `int` の範囲を超えても、桁数を気にせず計算できる整数の型です。暗号で使う巨大な数の計算に欠かせません。
- **2 進数（ビット）**: 0 と 1 だけで数を表す方法です。`101` は 10 進数の 5 を表します。
- **2 の補数**: 負の数を、ビットの列で表す方法の一つです。ビットを反転して 1 を足すと、同じ大きさの負の数になります。
- **精度（precision）**: 数を何ビットで扱うかを決める値です。0 より大きいときは、その桁数に合わせて末尾を切り取ります。
- **`ltrim`**: 文字列の先頭から、指定した文字を取り除く関数です。ここでは、先頭の 0 を取り除くのに使っています。

## 何をしているか

### 1. 整数を 2 進数の文字列にする

```php:line-numbers=262
        $hex = $this->toBytes($twos_compliment);
        $bits = Strings::bin2bits($hex);
```

`toBytes` で、整数をバイトの列にします。さらに `Strings::bin2bits` で、そのバイトを 0 と 1 の文字列に変えます。ここでは、まだ先頭に 0 が並んだままです。

### 2. 精度か、先頭の 0 で整える

```php:line-numbers=265
        $result = $this->precision > 0 ? substr($bits, -$this->precision) : ltrim($bits, '0');
```

精度が正なら、末尾から精度分の桁だけを `substr` で残します。精度が無ければ、`ltrim` で先頭の 0 を取り除きます。どちらの場合も、結果は必要な桁だけになります。

### 3. 2 の補数の指定があれば、正の数の先頭に 0 を付ける

```php:line-numbers=267
        if ($twos_compliment && $this->compare(new static()) > 0 && $this->precision <= 0) {
            return '0' . $result;
        }
```

2 の補数の形で書くとき、数が 0 より大きく、精度が指定されていないときは、先頭に `0` を付けます。正の数でも、先頭のビットが 1 になることがあります。そのまま書くと、2 の補数では負の数と読まれてしまうので、先頭に 0 を足して区別します。

### 4. 結果を返す

```php:line-numbers=271
        return $result;
```

整えた 2 進数の文字列を返します。

## ここがすごい

- 数を一度バイトに変えてから、ビットの文字列にする二段階で、どんなに大きな数でも同じ手順で扱えます。
- 精度の有無で、末尾を切るか先頭の 0 を取るかを分けています。用途に合った長さの文字列が、一つの関数で得られます。
- 正の数に限って先頭の 0 を付けて、符号のビットを守っています。2 の補数の決まりを、わずかな条件で正しく表しています。
- 結果を文字列で返すので、暗号の処理で、ビットごとに取り出したり、結合したりするのが簡単です。

## まとめ

`toBits` は、大きな整数を、精度と符号に合わせた 2 進数の文字列に変換する関数です。バイトを経由して変換し、精度に応じて桁を整え、2 の補数の指定があるときは正の数の先頭に 0 を付けて区別します。暗号の計算を、ビットの世界で扱うための、橋渡しになる関数です。
