---
title: "時刻とランダムを組み合わせ、同じミリ秒でも順番が増える ULID"
description: "Symfony の Ulid::generate は、時刻とランダムな値から、26 文字の ULID を作ります。同じミリ秒に複数作っても、ランダムな部分を 1 ずつ増やして、作った順に並ぶようにしています。"
language: php
project: Symfony
repo: https://github.com/symfony/symfony
license: MIT
copyright: Copyright (c) 2004-present Fabien Potencier
commit: "7c22be9fc7d3ea202cd09573edf6658cf427fcad"
file: src/Symfony/Component/Uid/Ulid.php
lines: [212, 266]
function: Ulid::generate
difficulty: 3
format: 2
tags: [乱数, データ構造, 最適化]
---

## ひとことで

`Ulid::generate` は、**ULID**（26 文字の英数字で作られる一意な識別子）を作る関数です。先頭に時刻、後ろにランダムな値が入るので、作られた順に文字列を並べると、ほぼ時間順になります。データベースの主キーとしても使いやすい形です。

## コード

::: code-group

```php:line-numbers=212 [日本語訳]
    public static function generate(?\DateTimeInterface $time = null): string
    {
        if (null === $mtime = $time) {
            if (\PHP_INT_SIZE >= 8) {
                // microtime(true) のほうが速く、マイクロ秒まで正確なので、それを使う。
                $time = (string) intdiv((int) (microtime(true) * 1000000 + .5), 1000);
            } else {
                $time = microtime(false);
                $time = substr($time, 11).substr($time, 2, 3);
            }
        } elseif (0 > $time = $time->format('Uv')) {
            throw new InvalidArgumentException('The timestamp must be positive.');
        }

        if ($time > self::$time || (null !== $mtime && $time !== self::$time)) {
            randomize:
            $r = unpack('n*', random_bytes(10));
            $r[1] |= ($r[5] <<= 4) & 0xF0000;
            $r[2] |= ($r[5] <<= 4) & 0xF0000;
            $r[3] |= ($r[5] <<= 4) & 0xF0000;
            $r[4] |= ($r[5] <<= 4) & 0xF0000;
            unset($r[5]);
            self::$rand = $r;
            self::$time = $time;
        } elseif ([1 => 0xFFFFF, 0xFFFFF, 0xFFFFF, 0xFFFFF] === self::$rand) {
            if (\PHP_INT_SIZE >= 8 || 10 > \strlen($time = self::$time)) {
                $time = (string) (1 + $time);
            } elseif ('999999999' === $mtime = substr($time, -9)) {
                $time = (1 + substr($time, 0, -9)).'000000000';
            } else {
                $time = substr_replace($time, str_pad(++$mtime, 9, '0', \STR_PAD_LEFT), -9);
            }

            goto randomize;
        } else {
            for ($i = 4; $i > 0 && 0xFFFFF === self::$rand[$i]; --$i) {
                self::$rand[$i] = 0;
            }

            ++self::$rand[$i];
            $time = self::$time;
        }

        if (\PHP_INT_SIZE >= 8) {
            // 20 ビットの乱数 2 つで 40 ビットになり、Base32 の 8 文字になる。
            return strtr(\sprintf('%010s%08s%08s', base_convert($time, 10, 32), base_convert((string) (self::$rand[1] << 20 | self::$rand[2]), 10, 32), base_convert((string) (self::$rand[3] << 20 | self::$rand[4]), 10, 32)), 'abcdefghijklmnopqrstuv', 'ABCDEFGHJKMNPQRSTVWXYZ');
        }

        return self::timestampToBase32($time).strtr(\sprintf('%04s%04s%04s%04s',
            base_convert(self::$rand[1], 10, 32),
            base_convert(self::$rand[2], 10, 32),
            base_convert(self::$rand[3], 10, 32),
            base_convert(self::$rand[4], 10, 32)
        ), 'abcdefghijklmnopqrstuv', 'ABCDEFGHJKMNPQRSTVWXYZ');
    }
```

```php:line-numbers=212 [原文]
    public static function generate(?\DateTimeInterface $time = null): string
    {
        if (null === $mtime = $time) {
            if (\PHP_INT_SIZE >= 8) {
                // microtime(true) is faster than microtime(false), and precise enough to give the exact microsecond
                $time = (string) intdiv((int) (microtime(true) * 1000000 + .5), 1000);
            } else {
                $time = microtime(false);
                $time = substr($time, 11).substr($time, 2, 3);
            }
        } elseif (0 > $time = $time->format('Uv')) {
            throw new InvalidArgumentException('The timestamp must be positive.');
        }

        if ($time > self::$time || (null !== $mtime && $time !== self::$time)) {
            randomize:
            $r = unpack('n*', random_bytes(10));
            $r[1] |= ($r[5] <<= 4) & 0xF0000;
            $r[2] |= ($r[5] <<= 4) & 0xF0000;
            $r[3] |= ($r[5] <<= 4) & 0xF0000;
            $r[4] |= ($r[5] <<= 4) & 0xF0000;
            unset($r[5]);
            self::$rand = $r;
            self::$time = $time;
        } elseif ([1 => 0xFFFFF, 0xFFFFF, 0xFFFFF, 0xFFFFF] === self::$rand) {
            if (\PHP_INT_SIZE >= 8 || 10 > \strlen($time = self::$time)) {
                $time = (string) (1 + $time);
            } elseif ('999999999' === $mtime = substr($time, -9)) {
                $time = (1 + substr($time, 0, -9)).'000000000';
            } else {
                $time = substr_replace($time, str_pad(++$mtime, 9, '0', \STR_PAD_LEFT), -9);
            }

            goto randomize;
        } else {
            for ($i = 4; $i > 0 && 0xFFFFF === self::$rand[$i]; --$i) {
                self::$rand[$i] = 0;
            }

            ++self::$rand[$i];
            $time = self::$time;
        }

        if (\PHP_INT_SIZE >= 8) {
            // Pairs of 20-bit random numbers make 40 bits, which is 8 base-32 digits
            return strtr(\sprintf('%010s%08s%08s', base_convert($time, 10, 32), base_convert((string) (self::$rand[1] << 20 | self::$rand[2]), 10, 32), base_convert((string) (self::$rand[3] << 20 | self::$rand[4]), 10, 32)), 'abcdefghijklmnopqrstuv', 'ABCDEFGHJKMNPQRSTVWXYZ');
        }

        return self::timestampToBase32($time).strtr(\sprintf('%04s%04s%04s%04s',
            base_convert(self::$rand[1], 10, 32),
            base_convert(self::$rand[2], 10, 32),
            base_convert(self::$rand[3], 10, 32),
            base_convert(self::$rand[4], 10, 32)
        ), 'abcdefghijklmnopqrstuv', 'ABCDEFGHJKMNPQRSTVWXYZ');
    }
```

:::

## 前提知識

- **ULID**: 時刻を表す 10 文字と、ランダムな 16 文字の、合わせて 26 文字で表す識別子です。UUID より短く、並べ替えやすいのが特徴です。
- **Base32**: 0 から 9、A から Z の 32 種類の文字で数を表す方法です。
- **ミリ秒**: 1 秒の 1000 分の 1 の単位です。
- **`random_bytes`**: 暗号に使える乱数のバイト列を作る関数です。
- **`goto`**: プログラムの別の場所へ直接飛ぶ命令です。ここでは同じ乱数の作り直しに使われています。

## 何をしているか

### 1. 現在時刻を、ミリ秒で取り出す

::: code-group

```php:line-numbers=214 [日本語訳]
        if (null === $mtime = $time) {
            if (\PHP_INT_SIZE >= 8) {
                // microtime(true) のほうが速く、マイクロ秒まで正確なので、それを使う。
                $time = (string) intdiv((int) (microtime(true) * 1000000 + .5), 1000);
            } else {
                $time = microtime(false);
                $time = substr($time, 11).substr($time, 2, 3);
            }
```

```php:line-numbers=214 [原文]
        if (null === $mtime = $time) {
            if (\PHP_INT_SIZE >= 8) {
                // microtime(true) is faster than microtime(false), and precise enough to give the exact microsecond
                $time = (string) intdiv((int) (microtime(true) * 1000000 + .5), 1000);
            } else {
                $time = microtime(false);
                $time = substr($time, 11).substr($time, 2, 3);
            }
```

:::

時刻を指定されなければ、現在の時刻をミリ秒の整数にします。64 ビットの PHP では `microtime(true)` を使います。`$time` が決まったら、以降はその値を使います。

### 2. 同じ時刻なら、ランダムな値を 1 増やす

```php:line-numbers=226
        if ($time > self::$time || (null !== $mtime && $time !== self::$time)) {
            randomize:
            $r = unpack('n*', random_bytes(10));
            $r[1] |= ($r[5] <<= 4) & 0xF0000;
            $r[2] |= ($r[5] <<= 4) & 0xF0000;
            $r[3] |= ($r[5] <<= 4) & 0xF0000;
            $r[4] |= ($r[5] <<= 4) & 0xF0000;
            unset($r[5]);
            self::$rand = $r;
            self::$time = $time;
        } elseif ([1 => 0xFFFFF, 0xFFFFF, 0xFFFFF, 0xFFFFF] === self::$rand) {
            if (\PHP_INT_SIZE >= 8 || 10 > \strlen($time = self::$time)) {
                $time = (string) (1 + $time);
            } elseif ('999999999' === $mtime = substr($time, -9)) {
                $time = (1 + substr($time, 0, -9)).'000000000';
            } else {
                $time = substr_replace($time, str_pad(++$mtime, 9, '0', \STR_PAD_LEFT), -9);
            }

            goto randomize;
        } else {
            for ($i = 4; $i > 0 && 0xFFFFF === self::$rand[$i]; --$i) {
                self::$rand[$i] = 0;
            }

            ++self::$rand[$i];
            $time = self::$time;
        }
```

前回と同じ時刻なら、ランダムな部分（`$rand`）を 1 増やします。増やした値が上限に達したら、時刻を 1 進めて、新しい乱数を作り直します。どちらの場合も、同じ時刻の中で ULID は増え続けます。

### 3. 時刻とランダムの部分を、Base32 の文字列にする

::: code-group

```php:line-numbers=255 [日本語訳]
        if (\PHP_INT_SIZE >= 8) {
            // 20 ビットの乱数 2 つで 40 ビットになり、Base32 の 8 文字になる。
            return strtr(\sprintf('%010s%08s%08s', base_convert($time, 10, 32), base_convert((string) (self::$rand[1] << 20 | self::$rand[2]), 10, 32), base_convert((string) (self::$rand[3] << 20 | self::$rand[4]), 10, 32)), 'abcdefghijklmnopqrstuv', 'ABCDEFGHJKMNPQRSTVWXYZ');
        }
```

```php:line-numbers=255 [原文]
        if (\PHP_INT_SIZE >= 8) {
            // Pairs of 20-bit random numbers make 40 bits, which is 8 base-32 digits
            return strtr(\sprintf('%010s%08s%08s', base_convert($time, 10, 32), base_convert((string) (self::$rand[1] << 20 | self::$rand[2]), 10, 32), base_convert((string) (self::$rand[3] << 20 | self::$rand[4]), 10, 32)), 'abcdefghijklmnopqrstuv', 'ABCDEFGHJKMNPQRSTVWXYZ');
        }
```

:::

64 ビットの PHP では、時刻を 10 文字、ランダムを 16 文字の Base32 にして、つなぎます。`strtr` と `sprintf` で、桁をそろえます。

具体例として、同じミリ秒に 2 つ作ると、後のものは前のものより文字列が大きくなります。そのため、並べ替えると作った順になります。

## ここがすごい

### 同じ時刻でも、順番を保つ工夫

時刻が同じでも、ランダムな部分を 1 増やすことで、後に作られた ULID が必ず大きい値になります。ランダムな値だけだと、同じミリ秒の中で順番が入れ替わってしまいます。この関数は、その問題を「1 増やす」という単純な方法で解決しています。

### 上限にぶつかったときは、時刻を進める

ランダムな値の上限（すべてのビットが 1）に達すると、もう増やせません。そこで時刻を 1 ミリ秒進めて、新しい乱数を作ります。時刻が進んでいるので、順番はこわれません。

### 32 ビットの PHP のための、別の道

```php:line-numbers=260
        return self::timestampToBase32($time).strtr(\sprintf('%04s%04s%04s%04s',
            base_convert(self::$rand[1], 10, 32),
            base_convert(self::$rand[2], 10, 32),
            base_convert(self::$rand[3], 10, 32),
            base_convert(self::$rand[4], 10, 32)
```

PHP が 32 ビットのときは、整数が大きな値を扱えないので、文字列の計算で同じ結果を作っています。どの環境でも同じ ULID になるように、分岐を分けて書かれています。

## まとめ

- 時刻とランダムを組み合わせると、一意で並べやすい識別子になる。
- 同じ時刻の中では、ランダムな値を 1 ずつ増やすと、順番が保たれる。
- 上限に達したら時刻を進めると、順番を壊さずに続けられる。
- 環境による違い（ビット数）は、分岐でどちらでも同じ結果になるように書く。
