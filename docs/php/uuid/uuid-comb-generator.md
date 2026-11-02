---
title: 時刻を末尾に埋め込み、並べたときに順番がそろう UUID
description: Ramsey UUID の CombGenerator::generate は、ランダムなバイトの後ろに現在時刻を付けた識別子を作ります。データベースの索引が散らばりにくくなるように、順番がおおむね時刻どおりになるのが工夫です。
language: php
project: Ramsey UUID
repo: https://github.com/ramsey/uuid
license: MIT
copyright: Copyright (c) 2012-2025 Ben Ramsey <ben@benramsey.com>
commit: "dc681915388ca5fd55a7fcb7c85bd9202f20fd4a"
file: src/Generator/CombGenerator.php
lines: [74, 101]
function: CombGenerator::generate
difficulty: 3
format: 2
tags: [乱数, ハッシュ, データ構造, 最適化]
---

## ひとことで

`CombGenerator::generate` は、**一意な識別子（UUID のような値）** を作るための部品です。ランダムな部分と、時刻の部分を組み合わせることで、作られた順にだいたい並ぶ値を作ります。データベースの主キーに使うと、索引の効率がよくなります。

## コード

::: code-group

```php:line-numbers=74 [日本語訳]
    public function generate(int $length): string
    {
        if ($length < self::TIMESTAMP_BYTES) {
            throw new InvalidArgumentException(
                'Length must be a positive integer greater than or equal to ' . self::TIMESTAMP_BYTES
            );
        }

        if ($length % 2 !== 0) {
            throw new InvalidArgumentException('Length must be an even number');
        }

        $hash = '';

        /** @phpstan-ignore greater.alwaysTrue（TIMESTAMP_BYTES は子クラスで変わることがあるため） */
        if (self::TIMESTAMP_BYTES > 0 && $length > self::TIMESTAMP_BYTES) {
            $hash = $this->generator->generate($length - self::TIMESTAMP_BYTES);
        }

        $lsbTime = str_pad(
            $this->numberConverter->toHex($this->timestamp()),
            self::TIMESTAMP_BYTES * 2,
            '0',
            STR_PAD_LEFT,
        );

        return (string) hex2bin(str_pad(bin2hex($hash), $length - self::TIMESTAMP_BYTES, '0') . $lsbTime);
    }
```

```php:line-numbers=74 [原文]
    public function generate(int $length): string
    {
        if ($length < self::TIMESTAMP_BYTES) {
            throw new InvalidArgumentException(
                'Length must be a positive integer greater than or equal to ' . self::TIMESTAMP_BYTES
            );
        }

        if ($length % 2 !== 0) {
            throw new InvalidArgumentException('Length must be an even number');
        }

        $hash = '';

        /** @phpstan-ignore greater.alwaysTrue (TIMESTAMP_BYTES constant could change in child classes) */
        if (self::TIMESTAMP_BYTES > 0 && $length > self::TIMESTAMP_BYTES) {
            $hash = $this->generator->generate($length - self::TIMESTAMP_BYTES);
        }

        $lsbTime = str_pad(
            $this->numberConverter->toHex($this->timestamp()),
            self::TIMESTAMP_BYTES * 2,
            '0',
            STR_PAD_LEFT,
        );

        return (string) hex2bin(str_pad(bin2hex($hash), $length - self::TIMESTAMP_BYTES, '0') . $lsbTime);
    }
```

:::

## 前提知識

- **UUID**: 世界中で重ならないように作られた、長い識別子です。`550e8400-e29b-...` のように、16 バイトを 16 進数で表します。
- **16 進数**: 0 から f の 16 種類の数字で表す書き方です。1 バイトは 2 桁の 16 進数になります。
- **索引（インデックス）**: データを探しやすくするために、並べて覚えておく仕組みです。
- **`str_pad`**: 文字列の足りない部分を、指定した文字で埋める関数です。
- **`bin2hex` / `hex2bin`**: バイナリと 16 進数の文字列を、互いに変換する関数です。

## 何をしているか

### 1. 長さの条件を確かめる

```php:line-numbers=76
        if ($length < self::TIMESTAMP_BYTES) {
            throw new InvalidArgumentException(
                'Length must be a positive integer greater than or equal to ' . self::TIMESTAMP_BYTES
            );
        }

        if ($length % 2 !== 0) {
            throw new InvalidArgumentException('Length must be an even number');
        }
```

時刻の部分（`TIMESTAMP_BYTES`）より短い長さや、奇数の長さは作れません。16 進数の 2 桁が 1 バイトなので、長さは偶数でなければなりません。条件に合わなければ例外にします。

### 2. ランダムな部分を作る

::: code-group

```php:line-numbers=86 [日本語訳]
        $hash = '';

        /** @phpstan-ignore greater.alwaysTrue（TIMESTAMP_BYTES は子クラスで変わることがあるため） */
        if (self::TIMESTAMP_BYTES > 0 && $length > self::TIMESTAMP_BYTES) {
            $hash = $this->generator->generate($length - self::TIMESTAMP_BYTES);
        }
```

```php:line-numbers=86 [原文]
        $hash = '';

        /** @phpstan-ignore greater.alwaysTrue (TIMESTAMP_BYTES constant could change in child classes) */
        if (self::TIMESTAMP_BYTES > 0 && $length > self::TIMESTAMP_BYTES) {
            $hash = $this->generator->generate($length - self::TIMESTAMP_BYTES);
        }
```

:::

全体の長さから時刻の部分を引いた長さのランダムな部分を、`$this->generator` に作ってもらいます。長さが足りなければ、ランダムな部分は作りません。

### 3. 時刻を 16 進数にして、後ろに付ける

```php:line-numbers=93
        $lsbTime = str_pad(
            $this->numberConverter->toHex($this->timestamp()),
            self::TIMESTAMP_BYTES * 2,
            '0',
            STR_PAD_LEFT,
        );
```

現在時刻を `$this->numberConverter->toHex` で 16 進数にし、`str_pad` で決まった長さに左から 0 埋めします。これが、末尾に付く時刻の部分（`$lsbTime`）です。

### 4. つないでバイナリに戻す

```php:line-numbers=100
        return (string) hex2bin(str_pad(bin2hex($hash), $length - self::TIMESTAMP_BYTES, '0') . $lsbTime);
```

ランダムな部分の 16 進数と時刻の部分をつないで、`hex2bin` でバイトに戻します。ランダムな部分の長さは `str_pad` で揃えています。こうして、先頭はランダム、末尾は時刻の識別子が完成します。

## ここがすごい

### 時刻を「末尾」に置く、索引への配慮

完全にランダムな UUID は、作られた順番と無関係に値が散らばります。データベースの索引は、値が近い順に並んでいると効率がよいので、散らばりは遅さの原因になります。この関数は、時刻を末尾に付けて、おおむね作られた順に並ぶようにしています。

### 先頭をランダムにする理由

時刻だけを使うと、同じ瞬間に作られた識別子が重なるおそれがあります。先頭にランダムな部分を置くことで、一意性を保ちながら順番のよさも得ています。ランダムと時刻の割合を、長さで調整できるのも特徴です。

### 小さな関数に、条件と組み立てを分ける

長さの確認、ランダムの生成、時刻の変換、つなぎ合わせが、それぞれ分かれています。どこが間違っていても、どの段階かがすぐにわかる書き方です。

## まとめ

- 識別子の末尾に時刻を置くと、索引に入れたときの散らばりが減る。
- ランダムな部分と時刻の部分を組み合わせると、一意性と並びやすさを両立できる。
- 16 進数は 1 バイトが 2 桁なので、長さの条件は偶数にそろえる必要がある。
- 組み立ての段階を分けると、どこで失敗したかが読み取りやすい。
