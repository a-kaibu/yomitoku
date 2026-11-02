---
title: 丸めの方法を文字で選ぶ、Twig の round フィルター
description: Twig の round フィルターは、数値の丸め方を common、ceil、floor の文字で選びます。関数名を変数に入れて呼び出す PHP の仕組みを使い、10 の累乗で小数点の位置をずらして丸めます。
language: php
project: Twig
repo: https://github.com/twigphp/Twig
license: BSD-3-Clause
copyright: Copyright (c) 2009-present by the Twig Team
commit: "beb4b229784425ceb6514cec9c573b3e42b30703"
file: src/Extension/CoreExtension.php
lines: [659, 672]
function: CoreExtension::round
difficulty: 2
format: 2
tags: [数値計算, メタプログラミング, 防御的プログラミング]
---
## ひとことで

`round` は、Twig テンプレートで数値を丸めるフィルターです。`{{ price|round(0, 'ceil') }}` のように、丸める桁数と方法を指定します。方法は、四捨五入（`common`）、切り上げ（`ceil`）、切り捨て（`floor`）から選べます。

## コード

```php:line-numbers=659
    public static function round($value, $precision = 0, $method = 'common')
    {
        $value = (float) $value;

        if ('common' === $method) {
            return round($value, $precision);
        }

        if ('ceil' !== $method && 'floor' !== $method) {
            throw new RuntimeError('The "round" filter only supports the "common", "ceil", and "floor" methods.');
        }

        return $method($value * 10 ** $precision) / 10 ** $precision;
    }
```

## 前提知識

- **四捨五入・切り上げ・切り捨て**: `round` は四捨五入、`ceil` は小数点以下を上へ、`floor` は下へ丸めます。`ceil(2.1)` は `3`、`floor(2.9)` は `2` です。
- **`10 ** $precision`**: 10 の累乗を計算する演算子です。`10 ** 2` は `100` です。
- **可変の関数呼び出し `$method(...)`**: 変数に入った文字列（`'ceil'` など）を関数名として呼ぶ PHP の書き方です。
- **`(float)`**: 値を小数に変換するキャストです。
- **`round($value, $precision)`**: PHP の組み込み関数で、指定の桁数に四捨五入します。

## 何をしているか

### 1. 四捨五入は組み込みの round に任せる

```php:line-numbers=663
        if ('common' === $method) {
            return round($value, $precision);
        }
```

既定の `common` のときは、PHP の `round` にそのまま渡します。桁数の指定も、組み込みの関数が処理します。

### 2. 対応していない方法は例外にする

```php:line-numbers=667
        if ('ceil' !== $method && 'floor' !== $method) {
            throw new RuntimeError('The "round" filter only supports the "common", "ceil", and "floor" methods.');
        }
```

`common`、`ceil`、`floor` 以外の文字が来たら、例外を投げます。テンプレートの書き間違いを、表示の段階で見つけられます。

### 3. 小数点を動かして丸め、戻す

```php:line-numbers=671
        return $method($value * 10 ** $precision) / 10 ** $precision;
```

`ceil` か `floor` の関数を、`$method` の文字列で呼びます。その前に、`10 ** $precision` を掛けて、丸めたい桁を整数の位置に動かします。丸めたあと、同じ数で割って元の桁に戻します。

たとえば `3.14159` を小数 2 桁で切り上げると、`3.14159 * 100 = 314.159` を `ceil` して `315`、それを `100` で割って `3.15` です。

## ここがすごい

- **関数名を文字で選ぶ**: `if` を 2 つ並べて `ceil` と `floor` を呼び分けるのではなく、文字列を関数名として使い、呼び出しを 1 行にまとめています。
- **小数点の位置を動かす定番の計算**: 桁を整数の位置に動かしてから丸める、という方法は、電卓の計算と同じ考え方です。
- **共通の丸めは組み込みに任せる**: 四捨五入の細かい仕様は、PHP の `round` に任せています。自前で書くより、誤差の扱いが安定します。
- **テンプレートの誤りを早く知らせる**: 対応外の方法は、黙って別の丸めをせず、例外にしています。

## まとめ

- 丸めの方法を選べるようにするには、文字列を関数名として使うと 1 行で書ける。
- 小数点を 10 の累乗で動かしてから丸め、戻す。
- 組み込みで済む処理は、組み込みに任せる。
- 対応外の入力は例外にすると、テンプレートの誤りを見つけやすい。
