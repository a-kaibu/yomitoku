---
title: バイト列を、好きな文字の並びで表す数に変える
description: Symfony の BinaryUtil::toBase は、バイト列を Base58 や Base32 のような別の基数の文字列に変えます。大きな数を割り算で桁に分けるとき、32 ビットずつまとめて計算しています。
language: php
project: Symfony
repo: https://github.com/symfony/symfony
license: MIT
copyright: Copyright (c) 2004-present Fabien Potencier
commit: "7c22be9fc7d3ea202cd09573edf6658cf427fcad"
file: src/Symfony/Component/Uid/BinaryUtil.php
lines: [49, 108]
function: BinaryUtil::toBase
difficulty: 3
format: 2
tags: [数値計算, アルゴリズム, 文字列処理]
---

## ひとことで

`toBase` は、バイト列を **別の基数（Base58 や Base32 など）の文字列** に変換します。バイト列を 1 つの大きな数とみなし、文字の数で割っていって、余りを桁として取り出します。ULID や短い ID を作るときの土台になる関数です。

## コード

::: code-group

```php:line-numbers=49 [日本語訳]
    public static function toBase(string $bytes, array $map): string
    {
        $base = \strlen($alphabet = $map['']);
        $digits = '';

        if (\PHP_INT_SIZE >= 8) {
            // 32 ビットのかたまりを、2^31 未満の基数の最大の累乗で割ると、1 回の割り算で複数の桁が得られる。
            for ($power = $base, $n = 1; $power * $base < 0x80000000; ++$n) {
                $power *= $base;
            }

            $limbs = unpack('N*', str_pad($bytes, (\strlen($bytes) + 3) & ~3, "\0", \STR_PAD_LEFT));

            while ($limbs) {
                $quotient = [];
                $remainder = 0;

                foreach ($limbs as $limb) {
                    $carry = $limb | $remainder << 32;
                    $remainder = $carry % $power;

                    if (($digit = intdiv($carry, $power)) || $quotient) {
                        $quotient[] = $digit;
                    }
                }

                $limbs = $quotient;
                $i = $n;

                do {
                    $digits = $alphabet[$remainder % $base].$digits;
                    $remainder = intdiv($remainder, $base);
                } while ($limbs ? --$i : $remainder);
            }

            return $digits;
        }

        $bytes = array_values(unpack('C*', $bytes));

        while ($count = \count($bytes)) {
            $quotient = [];
            $remainder = 0;

            for ($i = 0; $i !== $count; ++$i) {
                $carry = $bytes[$i] + ($remainder << 8);
                $digit = intdiv($carry, $base);
                $remainder = $carry % $base;

                if ($digit || $quotient) {
                    $quotient[] = $digit;
                }
            }

            $digits = $alphabet[$remainder].$digits;
            $bytes = $quotient;
        }

        return $digits;
    }
```

```php:line-numbers=49 [原文]
    public static function toBase(string $bytes, array $map): string
    {
        $base = \strlen($alphabet = $map['']);
        $digits = '';

        if (\PHP_INT_SIZE >= 8) {
            // Dividing 32-bit limbs by the largest power of the base below 2^31 yields several digits per division
            for ($power = $base, $n = 1; $power * $base < 0x80000000; ++$n) {
                $power *= $base;
            }

            $limbs = unpack('N*', str_pad($bytes, (\strlen($bytes) + 3) & ~3, "\0", \STR_PAD_LEFT));

            while ($limbs) {
                $quotient = [];
                $remainder = 0;

                foreach ($limbs as $limb) {
                    $carry = $limb | $remainder << 32;
                    $remainder = $carry % $power;

                    if (($digit = intdiv($carry, $power)) || $quotient) {
                        $quotient[] = $digit;
                    }
                }

                $limbs = $quotient;
                $i = $n;

                do {
                    $digits = $alphabet[$remainder % $base].$digits;
                    $remainder = intdiv($remainder, $base);
                } while ($limbs ? --$i : $remainder);
            }

            return $digits;
        }

        $bytes = array_values(unpack('C*', $bytes));

        while ($count = \count($bytes)) {
            $quotient = [];
            $remainder = 0;

            for ($i = 0; $i !== $count; ++$i) {
                $carry = $bytes[$i] + ($remainder << 8);
                $digit = intdiv($carry, $base);
                $remainder = $carry % $base;

                if ($digit || $quotient) {
                    $quotient[] = $digit;
                }
            }

            $digits = $alphabet[$remainder].$digits;
            $bytes = $quotient;
        }

        return $digits;
    }
```

:::

## 前提知識

- **基数**: 数を表すときに使う文字の数です。10 進数は 10 種類、16 進数は 16 種類の数字を使います。
- **アルファベット**: 基数で使う文字の並びです。`0` から順番に、対応する文字を割り当てます。
- **割り算の余り**: 割り切れなかった部分です。基数で割った余りが、一番下の桁になります。
- **`unpack` / `pack` の形式**: `N`、`C` などの記号で、バイトを数の並びに変える指定です。
- **`intdiv`**: 整数の割り算で、小数点以下を切り捨てる関数です。

## 何をしているか

### 1. 基数と文字の並びを用意する

```php:line-numbers=51
        $base = \strlen($alphabet = $map['']);
```

`$map['']` には、使う文字の並び（アルファベット）が入っています。その文字数が、基数になります。

### 2. 64 ビットの PHP では、32 ビットずつ割る

::: code-group

```php:line-numbers=54 [日本語訳]
        if (\PHP_INT_SIZE >= 8) {
            // 32 ビットのかたまりを、2^31 未満の基数の最大の累乗で割ると、1 回の割り算で複数の桁が得られる。
            for ($power = $base, $n = 1; $power * $base < 0x80000000; ++$n) {
                $power *= $base;
            }

            $limbs = unpack('N*', str_pad($bytes, (\strlen($bytes) + 3) & ~3, "\0", \STR_PAD_LEFT));
```

```php:line-numbers=54 [原文]
        if (\PHP_INT_SIZE >= 8) {
            // Dividing 32-bit limbs by the largest power of the base below 2^31 yields several digits per division
            for ($power = $base, $n = 1; $power * $base < 0x80000000; ++$n) {
                $power *= $base;
            }

            $limbs = unpack('N*', str_pad($bytes, (\strlen($bytes) + 3) & ~3, "\0", \STR_PAD_LEFT));
```

:::

まず、基数の何乗までを一度に割れるかを求めます。32 ビットの「かたまり（limb）」を、その数で割ると、1 回の割り算で複数の桁が取れるからです。`unpack('N*', ...)` で、バイトを 4 バイトずつの数に変えます。

```php:line-numbers=62
            while ($limbs) {
                $quotient = [];
                $remainder = 0;

                foreach ($limbs as $limb) {
                    $carry = $limb | $remainder << 32;
                    $remainder = $carry % $power;

                    if (($digit = intdiv($carry, $power)) || $quotient) {
                        $quotient[] = $digit;
                    }
                }

                $limbs = $quotient;
```

各かたまりを、前の余りと合わせて割ります。商は次の回のための新しいかたまりになり、余りは桁の材料になります。

```php:line-numbers=76
                $i = $n;

                do {
                    $digits = $alphabet[$remainder % $base].$digits;
                    $remainder = intdiv($remainder, $base);
                } while ($limbs ? --$i : $remainder);
            }

            return $digits;
        }
```

余りを、アルファベットの文字に変えて、桁の前に付けていきます。商が 0 になるまで繰り返します。

### 3. それ以外の環境では、1 バイトずつ割る

```php:line-numbers=87
        $bytes = array_values(unpack('C*', $bytes));

        while ($count = \count($bytes)) {
            $quotient = [];
            $remainder = 0;

            for ($i = 0; $i !== $count; ++$i) {
                $carry = $bytes[$i] + ($remainder << 8);
                $digit = intdiv($carry, $base);
                $remainder = $carry % $base;

                if ($digit || $quotient) {
                    $quotient[] = $digit;
                }
            }

            $digits = $alphabet[$remainder].$digits;
            $bytes = $quotient;
        }
```

PHP が 64 ビットでないときは、1 バイトずつ同じ割り算を行います。やっていることは同じですが、一度に割る量が少なくなります。

具体例として、`toBase` にバイト列 `"\x01\x00"` を Base58 の文字で変換すると、大きな数の 58 進数の表記になります。

## ここがすごい

### 1 回の割り算で、たくさんの桁を取る

数を 1 桁ずつ取り出すと、割り算の回数が多くなって遅くなります。この関数は、基数の累乗を先に作り、32 ビットのかたまりごとに割ります。1 回の割り算で、複数の桁がまとめて得られるので、同じ結果を速く作れます。

### 環境に応じて、計算の大きさを変える

PHP の整数の大きさは、64 ビットか 32 ビットかで変わります。どちらでも正しく動くように、同じ考え方を 2 通りの書き方で実装しています。性能を取りつつ、どの環境でも結果が変わらない点がこの関数の大事なところです。

### 数学の割り算を、そのままプログラムにしている

「大きな数を基数で割って、余りを並べる」は、小学校で習う筆算と同じ考え方です。コードの中の割り算と余りの流れを追うと、数の表記が組み立てられていく様子がわかります。

## まとめ

- 大きな数を別の基数に変えるには、基数で割った余りを桁として並べていく。
- 一度に割る量を増やすと、割り算の回数が減って速くなる。
- 環境の違い（整数の大きさ）は、同じ結果になるように分けて書く。
- 文字の並びを変えるだけで、同じ数を違う見た目の ID にできる。
