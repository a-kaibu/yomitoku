---
title: 大文字と小文字、全角と半角の違いをそろえて比べやすくする
description: Symfony の AbstractUnicodeString の folded は、文字列を Unicode の正規化と小文字化で整え、表記のゆれを吸収した形に変えます。全角の英数字や大文字と小文字を同じものとして比べたいときに使われます。
language: php
project: Symfony
repo: https://github.com/symfony/symfony
license: MIT
copyright: Copyright (c) 2004-present Fabien Potencier
commit: "e6396e82011ded4608b896e8fff4da24d253382a"
file: src/Symfony/Component/String/AbstractUnicodeString.php
lines: [195, 207]
function: folded
difficulty: 3
format: 2
tags: [Unicode, 文字列処理, 標準ライブラリ]
---
## ひとことで

`folded` は、Unicode の文字列を、比べやすい形に整える関数です。全角の「ＡＢＣ」と半角の「ABC」、大文字の「A」と小文字の「a」を、同じ形にそろえます。元の文字列は変えず、整えた複製を新しいオブジェクトとして返します。

## コード

```php:line-numbers=195
    public function folded(bool $compat = true): static
    {
        $str = clone $this;

        if (!$compat || !\defined('Normalizer::NFKC_CF')) {
            $str->string = normalizer_normalize($str->string, $compat ? \Normalizer::NFKC : \Normalizer::NFC);
            $str->string = mb_strtolower(strtr($str->string, self::FOLD), 'UTF-8');
        } else {
            $str->string = normalizer_normalize($str->string, \Normalizer::NFKC_CF);
        }

        return $str;
    }
```

## 前提知識

- **Unicode の正規化**: 同じ文字を、複数の方法で表せるときに、一つの形にそろえる処理です。たとえば「が」は、1 文字の表し方と、「か」と濁点の 2 文字の表し方があります。
- **NFKC と NFC**: 正規化の形の種類です。NFKC は互換性のある文字（全角の英数字など）も、標準の形にそろえます。NFC は、見た目の違いは残し、表し方だけをそろえます。
- **大文字と小文字（case folding）**: 大文字と小文字を、同じものとして比べるための準備です。単に小文字にするより、言語ごとの細かな違いまで扱えます。
- **`clone`**: オブジェクトの複製を作るキーワードです。元のオブジェクトを変えずに、新しい値を持つものを返せます。
- **`normalizer_normalize` と `mb_strtolower`**: PHP の拡張機能で、正規化と小文字化を行う関数です。

## 何をしているか

### 1. 元の文字列を複製する

```php:line-numbers=197
        $str = clone $this;
```

`clone $this` で、今の文字列オブジェクトを複製します。元の値は変わりません。

### 2. 互換モードか、拡張が無い場合の処理

```php:line-numbers=199
        if (!$compat || !\defined('Normalizer::NFKC_CF')) {
            $str->string = normalizer_normalize($str->string, $compat ? \Normalizer::NFKC : \Normalizer::NFC);
            $str->string = mb_strtolower(strtr($str->string, self::FOLD), 'UTF-8');
```

`$compat` が `false` か、`Normalizer::NFKC_CF` の定数が無い環境では、二段階の処理をします。まず NFKC（互換モード）か NFC で正規化します。その後、`self::FOLD` という変換表を使って `strtr` で置き換え、`mb_strtolower` で小文字にします。

### 3. 拡張があれば、一度の処理で済ませる

```php:line-numbers=202
        } else {
            $str->string = normalizer_normalize($str->string, \Normalizer::NFKC_CF);
        }
```

拡張が使える環境では、`NFKC_CF` という正規化の形を使い、一度の処理で正規化と case folding をまとめて行います。

### 4. 整えた複製を返す

```php:line-numbers=206
        return $str;
```

最後に、整えた複製を返します。

## ここがすごい

- 拡張がある環境では一度の処理、無い環境では段階的な処理と、二つの道を用意しています。どの PHP の環境でも、同じ目的の結果が得られます。
- 元の文字列を複製してから書き換えるので、呼び出し側は、元の値が変わる心配をしなくて済みます。
- 大文字と小文字だけでなく、全角と半角のような互換性の違いも、同じ結果にそろえられます。比較の正しさが、一段上がっています。
- 変換表 `self::FOLD` を使って、標準の処理だけでは扱えない例外を補っています。細かな言語の違いにも、丁寧に対応しています。

## まとめ

`folded` は、Unicode の文字列を、正規化と case folding によって比べやすい形に整える関数です。拡張の有無で処理を分け、元の文字列は変えずに複製を返します。表記のゆれを吸収するという、文字列処理の難しさに正面から向き合った関数です。
