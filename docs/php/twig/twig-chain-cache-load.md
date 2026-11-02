---
title: 複数のキャッシュを順に試して、テンプレートのクラスを読み込む
description: Twig の ChainCache の load は、登録された複数のキャッシュを順番に試し、テンプレートのクラスが使えるようになった時点で止まります。1 つ目で見つからなければ次のキャッシュへ回る、フォールバックの仕組みです。
language: php
project: Twig
repo: https://github.com/twigphp/Twig
license: BSD-3-Clause
copyright: Copyright (c) 2009-present by the Twig Team.
commit: "beb4b229784425ceb6514cec9c573b3e42b30703"
file: src/Cache/ChainCache.php
lines: [46, 57]
function: load
difficulty: 2
format: 2
tags: [キャッシュ, 設計パターン, イテレータ]
---
## ひとことで

`load` は、Twig のテンプレートをコンパイルした PHP のクラスを、複数のキャッシュから順に探して読み込む関数です。最初に成功したキャッシュで読み込まれたクラスが使えるようになったら、残りのキャッシュは試しません。どのキャッシュも持っていなければ、後で Twig が作り直します。

## コード

```php:line-numbers=46
    public function load(string $key): void
    {
        [$name, $className] = $this->splitKey($key);

        foreach ($this->caches as $cache) {
            $cache->load($cache->generateKey($name, $className));

            if (class_exists($className, false)) {
                break;
            }
        }
    }
```

## 前提知識

- **テンプレートのキャッシュ**: Twig は、テンプレートを PHP のクラスに変換して、ファイルに保存しておけます。次に使うとき、変換をやり直さずに済みます。
- **キー**: キャッシュの中で、1 つのクラスを表す名前です。このコードでは、クラス名とテンプレート名を `#` でつないだ文字列を使います。
- **`class_exists($className, false)`**: クラスが読み込み済みかを調べる関数です。第 2 引数の `false` は、オートロードを試さないことを意味します。
- **`foreach` と `break`**: 一覧を順に回し、条件を満たしたら途中で抜ける書き方です。
- **連鎖（チェーン）**: 複数のキャッシュを並べ、順に試す設計パターンです。どれか 1 つが成功すれば、それで終わります。

## 何をしているか

### 1. キーから名前とクラス名を取り出す

```php:line-numbers=48
        [$name, $className] = $this->splitKey($key);
```

`$this->splitKey($key)` で、キーを分けて `$name` と `$className` を得ます。このキーは、`generateKey` が作ったものを逆にたどる働きをしています。

### 2. キャッシュを順に試す

```php:line-numbers=50
        foreach ($this->caches as $cache) {
            $cache->load($cache->generateKey($name, $className));
```

`foreach ($this->caches as $cache)` で、登録された順番にキャッシュを 1 つずつ見ます。各キャッシュに対して、`$cache->generateKey($name, $className)` で、そのキャッシュ用のキーを作り、`$cache->load(...)` を呼びます。それぞれのキャッシュは、自分の保存場所から、クラスを読み込もうとします。

### 3. クラスが使えたら止める

```php:line-numbers=53
            if (class_exists($className, false)) {
                break;
            }
```

`class_exists($className, false)` が `true` になったら、`break` で抜けます。読み込めたので、後のキャッシュを試す必要はありません。読み込めなかった場合は、次のキャッシュへ進みます。

### 4. どこにもなければ何もしない

```php:line-numbers=56
        }
    }
```

すべてのキャッシュを試しても見つからなければ、ループが終わるだけで、関数は何も返しません。呼び出し側は、クラスが読み込まれていないことを見て、テンプレートをコンパイルし直します。

## ここがすごい

- 高速なキャッシュを先頭に、遅いキャッシュを後ろに並べられます。1 つ目で見つかれば、その場で止まるので、遅い方のキャッシュは触られません。
- 呼び出し側は、どのキャッシュにクラスがあるかを知らなくて済みます。`load` を呼ぶだけで、順番の判断はこの関数が引き受けています。
- 成功したかどうかを、戻り値ではなく「クラスが使えるようになったか」で判断しています。キャッシュごとに、読み込みの仕方が違っても、結果だけを同じ基準で見られます。
- キーの作り方と読み取り方を、対になるメソッドで持っています。`generateKey` と `splitKey` が、同じ形式を保っているので、途中で形式が食い違う心配がありません。

## まとめ

`load` は、登録された複数のキャッシュを順に試し、テンプレートのクラスが読み込めた時点で止める関数です。遅いキャッシュを後ろに回せるので、速さと確実さを両立させる、典型的なフォールバックの仕組みになっています。短いループと `class_exists` の確認だけで、この連鎖が成り立っています。
