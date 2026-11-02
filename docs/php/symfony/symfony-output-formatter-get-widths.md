---
title: 全角文字の幅を数え、必要なときだけ幅の表を作る
description: Symfony Console の OutputFormatter::getWidths は、文字列の各文字の表示幅を求めます。全角の文字が 1 つも無ければ空の配列を返す早い経路を持ち、結果はキャッシュして使い回します。
language: php
project: Symfony
repo: https://github.com/symfony/symfony
license: MIT
copyright: Copyright (c) 2004-present Fabien Potencier
commit: "e6396e82011ded4608b896e8fff4da24d253382a"
file: src/Symfony/Component/Console/Formatter/OutputFormatter.php
lines: [424, 440]
function: OutputFormatter::getWidths
difficulty: 3
format: 2
tags: [Unicode, 最適化, キャッシュ]
---
## ひとことで

`getWidths` は、文字列の中の各文字が、ターミナルで何桁を使うかを一覧にする非公開の関数です。日本語などの全角文字は 2 桁、英数字は 1 桁を使います。全角が 1 つも無いなら、一覧を作らずに空の配列を返します。

## コード

```php:line-numbers=424
    private function getWidths(string $text): array
    {
        if (!preg_match('/[^\x00-\x{10FF}]/u', $text)) {
            return [];
        }

        $widths = [];
        $wide = false;
        foreach ($this->getTokens($text) as $token) {
            if (!preg_match(self::ANSI_REGEX, $token)) {
                $widths[] = $charWidth = 2 < \strlen($token) ? ($this->charWidths[$token] ??= Helper::width($token)) : 1;
                $wide = $wide || 1 < $charWidth;
            }
        }

        return $wide ? $widths : [];
    }
```

## 前提知識

- **表示幅**: 画面の 1 文字が占める桁の数です。ASCII の文字は 1 桁、日本語の漢字やかなの多くは 2 桁です。
- **UTF-8 の長さ**: `strlen` はバイト数を返します。`2 < strlen($token)` は、3 バイト以上の文字（日本語などの多くの文字）だけを、幅の計算の対象にするという意味です。
- **`??=`（null 合体代入）**: 左側が `null` のときだけ、右側の値を計算して代入する演算子です。キャッシュの書き方によく使われます。
- **`$this->charWidths`**: 文字と幅の対応を覚えておく配列です。同じ文字を何度も計算しないために使います。
- **`Helper::width`**: 文字列の表示幅を求める Symfony Console の共通の関数です。

## 何をしているか

### 1. 全角が無ければ空を返す

```php:line-numbers=426
        if (!preg_match('/[^\x00-\x{10FF}]/u', $text)) {
            return [];
        }
```

正規表現で、U+10FF より大きい文字を探します。ここでは、日本語などの全角を含むかの判定の目安として使われています。見つからなければ、幅の一覧は要らないので、空の配列を返します。

### 2. 文字ごとの幅を求める

```php:line-numbers=432
        foreach ($this->getTokens($text) as $token) {
            if (!preg_match(self::ANSI_REGEX, $token)) {
                $widths[] = $charWidth = 2 < \strlen($token) ? ($this->charWidths[$token] ??= Helper::width($token)) : 1;
```

色の制御記号を除いて、1 文字ずつ幅を求めます。3 バイト以上の文字だけは `Helper::width` を呼びます。それ以外は、ASCII の 1 文字なので、幅は 1 です。

結果は `$this->charWidths` に保存されます。同じ文字が次に出てきたときは、計算を省けます。

### 3. 全角があったときだけ一覧を返す

```php:line-numbers=435
                $wide = $wide || 1 < $charWidth;
            }
        }

        return $wide ? $widths : [];
```

幅が 1 より大きい文字が 1 つでもあったかを `$wide` で覚えます。最後に、全角があったときだけ一覧を返し、無ければ空の配列を返します。

## ここがすごい

- **早い経路で大半を済ます**: 全角を含まない文字列は、一覧を作らずに返します。通常の英文の表示では、この処理がほとんど無駄になりません。
- **キャッシュで同じ計算を避ける**: 同じ文字を何度も幅の計算にかけないように、結果を覚えておきます。`??=` で、1 行でキャッシュと計算を書いています。
- **必要なときだけ一覧を返す**: 全角があるかどうかを、最後の `$wide` で判断します。結果を使う側は、空の配列を「全部 1 桁」として扱えばよいです。
- **表示の正確さと速さを両立**: 正確な幅の計算は、全角を含む文字列だけで行います。速さを大きく損なわずに、表の揃えを正しくできます。

## まとめ

- 表示幅の計算は、全角が無いと分かったら早めに終わらせると速い。
- 同じ文字の幅はキャッシュすると、繰り返しの計算を避けられる。
- 「特別な場合があったか」を真偽値で覚えておくと、結果を返す形を簡単に決められる。
