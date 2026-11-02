---
title: バイト数を、KiBやMiBの単位に切り替えて表示する
description: Symfony Console の Helper::formatMemory は、バイト数の大きさに応じて B、KiB、MiB、GiB のどれで表すかを決めます。1024 で割る計算を、大きい単位から順に確かめる短い関数です。
language: php
project: Symfony
repo: https://github.com/symfony/symfony
license: MIT
copyright: Copyright (c) 2004-present Fabien Potencier
commit: "e6396e82011ded4608b896e8fff4da24d253382a"
file: src/Symfony/Component/Console/Helper/Helper.php
lines: [153, 168]
function: Helper::formatMemory
difficulty: 1
format: 2
tags: [数値計算, 文字列処理, 入出力]
---
## ひとことで

`formatMemory` は、メモリの使用量をバイト数で受け取り、人が読みやすい単位（B、KiB、MiB、GiB）の文字列に変える関数です。コマンドの実行後に「メモリ使用量: 3.0 MiB」のような表示をするときに使われます。

## コード

```php:line-numbers=153
    public static function formatMemory(int $memory): string
    {
        if ($memory >= 1024 * 1024 * 1024) {
            return \sprintf('%.1f GiB', $memory / 1024 / 1024 / 1024);
        }

        if ($memory >= 1024 * 1024) {
            return \sprintf('%.1f MiB', $memory / 1024 / 1024);
        }

        if ($memory >= 1024) {
            return \sprintf('%d KiB', $memory / 1024);
        }

        return \sprintf('%d B', $memory);
    }
```

## 前提知識

- **バイト（B）と KiB**: 1 KiB は 1024 バイトです。1000 ではなく 1024 なのは、コンピュータが 2 の累乗で数えるためです。
- **MiB と GiB**: 1 MiB は 1024 KiB、1 GiB は 1024 MiB です。
- **`\sprintf`**: 書式を指定して文字列を作る関数です。`%d` は整数、`%.1f` は小数点以下 1 桁の小数を表します。
- **`\`**: 名前空間の外の組み込み関数を指定する印です。`\sprintf` は PHP の `sprintf` を指します。
- **`if` の並び**: 条件を大きい単位から順に書くと、最初に当たったものを使えば十分です。

## 何をしているか

### 1. GiB の範囲を先に確かめる

```php:line-numbers=155
        if ($memory >= 1024 * 1024 * 1024) {
            return \sprintf('%.1f GiB', $memory / 1024 / 1024 / 1024);
        }
```

1 GiB（1024 の 3 乗）以上なら、3 回 1024 で割って GiB にします。`%.1f` なので、小数点以下 1 桁で表示されます。

### 2. MiB、KiB と順に確かめる

```php:line-numbers=159
        if ($memory >= 1024 * 1024) {
            return \sprintf('%.1f MiB', $memory / 1024 / 1024);
        }

        if ($memory >= 1024) {
            return \sprintf('%d KiB', $memory / 1024);
        }
```

同じ形の `if` が続きます。MiB は小数 1 桁で表し、KiB は `%d` で小数を切り捨てて整数にします。

### 3. どれにも当たらなければバイトのまま

```php:line-numbers=167
        return \sprintf('%d B', $memory);
```

1024 バイト未満なら、そのままの数字に `B` を付けて返します。

具体例で見ると、`1536` バイトは `1024` 以上なので KiB になります。`1536 / 1024` は `1.5` ですが、`%d` で切り捨てられて `1 KiB` と表示されます。`3145728` バイトは `3 MiB` ですが、`%.1f` で `3.0 MiB` と表示されます。

## ここがすごい

- **大きい単位から判定する**: 条件を大きい順に並べると、最初に当たった単位だけで答えが決まります。`else if` を連ねる必要がなく、「その単位以上か」だけを見ればよいです。
- **書式の使い分け**: MiB 以上は小数 1 桁、KiB は整数と、精度を単位で変えています。大きな単位は端数が重要になりにくいという判断です。
- **計算を単純に保つ**: 割り算を単位ごとに 1 回ずつ行うだけで、ループや表を使いません。短い関数で、目的がはっきり伝わります。
- **表示の一貫性**: 戻り値は必ず単位の記号付きの文字列です。呼び出し側は数字と単位を分けて考える必要がありません。

## まとめ

- バイト数は、大きい単位の閾値から順に比べると単位を決められる。
- 書式（`%d` と `%.1f`）で、単位ごとに表示の細かさを変えられる。
- 1024 で割る処理は、2 の累乗の単位を表すための基本の計算。
- 戻り値を単位付きの文字列にすると、表示側が単純になる。
