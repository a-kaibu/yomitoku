---
title: 設定と PHP のバージョンから、キャッシュの名前の一部を作る
description: Twig の Environment の getOptionsHash は、拡張機能の構成、PHP のバージョン、デバッグなどの設定を一つの文字列にまとめます。その文字列をキャッシュのキーに足すことで、設定が変わったときに古いキャッシュを使わないようにしています。
language: php
project: Twig
repo: https://github.com/twigphp/Twig
license: BSD-3-Clause
copyright: Copyright (c) 2009-present by the Twig Team.
commit: "beb4b229784425ceb6514cec9c573b3e42b30703"
file: src/Environment.php
lines: [970, 981]
function: getOptionsHash
difficulty: 2
format: 2
tags: [キャッシュ, ハッシュ, 防御的プログラミング]
---
## ひとことで

`getOptionsHash` は、Twig の環境（Environment）の設定を、1 つの文字列にまとめる関数です。この文字列は、コンパイル済みのテンプレートを保存するキャッシュのキーに、後ろから付け足されます。設定が変わると文字列も変わるので、古い設定で作られたキャッシュを誤って読み込まずに済みます。

## コード

```php:line-numbers=970
    private function getOptionsHash(): string
    {
        return implode(':', [
            $this->extensionSet->getSignature(),
            \PHP_MAJOR_VERSION,
            \PHP_MINOR_VERSION,
            self::VERSION,
            (int) $this->debug,
            (int) $this->strictVariables,
            $this->useYield ? '1' : '0',
        ]);
    }
```

## 前提知識

- **コンパイル済みテンプレート**: Twig は、テンプレートを PHP のクラスに変換してから実行します。その結果を、キャッシュとしてファイルに保存しておきます。
- **キャッシュのキー**: キャッシュの中で、1 つの保存物を探すための名前です。キーが同じなら、同じ物として扱われます。
- **拡張機能（エクステンション）**: Twig の機能（フィルターや関数など）を追加する部品です。その組み合わせが変わると、テンプレートの変換結果も変わります。
- **`PHP_MAJOR_VERSION` と `PHP_MINOR_VERSION`**: 実行している PHP の、メジャーとマイナーのバージョンを表す定数です。
- **`(int)` のキャスト**: 真偽値を `1` や `0` の整数に変えて、文字列に組み込めるようにする書き方です。

## 何をしているか

### 1. 変換結果に影響する要素を並べる

```php:line-numbers=972
        return implode(':', [
            $this->extensionSet->getSignature(),
            \PHP_MAJOR_VERSION,
            \PHP_MINOR_VERSION,
            self::VERSION,
            (int) $this->debug,
            (int) $this->strictVariables,
            $this->useYield ? '1' : '0',
        ]);
```

`implode(':', ...)` で、要素を `:` でつないだ 1 つの文字列を作ります。並べているのは、拡張機能の構成（`getSignature`）、PHP のバージョン、Twig 自身のバージョン、デバッグの有無、厳密な変数チェックの有無、そして `yield` を使うかどうかです。どれも、テンプレートをコンパイルした結果を左右する設定です。

真偽値は `(int)` で `1` か `0` にし、`yield` の有無は `'1'` か `'0'` の文字列にしています。どちらも、文字列の中で同じ形に並ぶようにするための工夫です。

### 2. キャッシュのキーに足して使う

この関数の戻り値は、同じ `Environment` クラスの `getTemplateClass` の近くで、キャッシュのキーに付け足されます。

```php:line-numbers=328
        $key = ($this->hotCache[$name] ?? $this->getLoader()->getCacheKey($name)).($this->optionsHash ??= $this->getOptionsHash());
```

テンプレートの名前から作ったキーに、`.` で結んでこの文字列を後ろにつなぎます。`$this->optionsHash ??=` で、一度作った文字列は再利用されます。

## ここがすごい

- 設定が変わったときに、キャッシュを消すという操作を利用者に求めません。キーの一部が変わるだけで、古いキャッシュは自然に使われなくなります。
- PHP のバージョンや Twig のバージョンも含めているので、アップグレード後に古いクラスが読み込まれる事故を防いでいます。
- 文字列の組み立てを 1 か所に集めているので、どの設定がキャッシュに影響するかが、この関数を見れば分かります。
- `??=` で一度だけ計算する作りになっています。毎回の描画で同じ文字列を作り直さずに済みます。

## まとめ

`getOptionsHash` は、キャッシュに影響する設定をまとめて、1 つの文字列にする関数です。その文字列をキャッシュのキーに足すことで、設定が変われば別のキャッシュを使う、という仕組みになっています。小さな関数ですが、キャッシュの正しさを保つための、大事な役割を担っています。
