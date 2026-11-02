---
title: テンプレートのキャッシュを無効にして、新しい名前で作り直させる
description: Twig の Environment の removeCache は、テンプレートの読み込み済みの場所を新しい名前に差し替えてから、キャッシュの実体を消します。同じ名前で読み直しても、古いクラスを再び使わないようにする仕組みです。
language: php
project: Twig
repo: https://github.com/twigphp/Twig
license: BSD-3-Clause
copyright: Copyright (c) 2009-present by the Twig Team.
commit: "beb4b229784425ceb6514cec9c573b3e42b30703"
file: src/Environment.php
lines: [259, 270]
function: removeCache
difficulty: 3
format: 2
tags: [キャッシュ, 防御的プログラミング, 設計パターン]
---
## ひとことで

`removeCache` は、あるテンプレートのコンパイル済みキャッシュを無効にする関数です。PHP はクラスを一度読み込むと、同じ名前で作り直せません。そこで、新しい名前のクラスを使うように差し替えてから、古いキャッシュを消します。テンプレートを書き換えた後の再読み込みに役立ちます。

## コード

```php:line-numbers=259
    public function removeCache(string $name): void
    {
        $cls = $this->getTemplateClass($name);
        $this->hotCache[$name] = $cls.'_'.bin2hex(random_bytes(16));
        unset($this->loadedWrappers[$cls]);

        if ($this->cache instanceof RemovableCacheInterface) {
            $this->cache->remove($name, $cls);
        } else {
            throw new \LogicException(\sprintf('The "%s" cache class does not support removing template cache as it does not implement the "RemovableCacheInterface" interface.', \get_class($this->cache)));
        }
    }
```

## 前提知識

- **コンパイル済みクラス**: Twig が、テンプレートを PHP のクラスに変換したものです。クラスは一度読み込まれると、同じ名前で定義し直すことができません。
- **`hotCache`**: テンプレートの名前から、今使うべきクラス名を覚えておく表です。ここに入っていれば、キャッシュの問い合わせを省けます。
- **`random_bytes`**: 予測しにくい乱数のバイト列を作る関数です。`bin2hex` で、16 バイトを 32 文字の文字列にしています。
- **`RemovableCacheInterface`**: キャッシュから特定のテンプレートを削除できることを表す、インターフェースです。
- **`LogicException`**: プログラムの使い方が誤っていることを表す例外です。ここでは、削除に対応していないキャッシュを使ったときに投げられます。

## 何をしているか

### 1. 今のクラス名を得て、新しい名前を覚える

```php:line-numbers=261
        $cls = $this->getTemplateClass($name);
        $this->hotCache[$name] = $cls.'_'.bin2hex(random_bytes(16));
```

`getTemplateClass` で、今のクラス名を得ます。そのあと、クラス名の後ろに `_` と乱数の文字列を付けた新しい名前を、`hotCache` に入れます。次に読み込むとき、この新しい名前が使われます。

### 2. 読み込み済みのクラスを忘れる

```php:line-numbers=263
        unset($this->loadedWrappers[$cls]);
```

`loadedWrappers` からも、元のクラス名を消します。これで、古いクラスが読み込み済みの記録として使われることがなくなります。

### 3. キャッシュ側に削除を頼む

```php:line-numbers=265
        if ($this->cache instanceof RemovableCacheInterface) {
            $this->cache->remove($name, $cls);
        } else {
            throw new \LogicException(\sprintf('The "%s" cache class does not support removing template cache as it does not implement the "RemovableCacheInterface" interface.', \get_class($this->cache)));
        }
```

キャッシュが `RemovableCacheInterface` を実装していれば、`remove` を呼んで、実体を消します。実装していなければ、例外で知らせます。削除の手段がないキャッシュを使っていると分かるように、キャッシュのクラス名もメッセージに入れています。

## ここがすごい

- PHP のクラスは消せないという制約を、名前を変えるという方法で回避しています。古いクラスを壊さずに、新しいクラスへ移れます。
- 乱数を名前に入れるので、同じテンプレートを何度作り直しても、名前が重ならないようにしています。
- 2 つの記録（`hotCache` と `loadedWrappers`）を、同時に整えています。片方だけ更新されて、食い違うことを防いでいます。
- 削除できないキャッシュに対しては、黙って失敗せず、例外で知らせます。利用者が、設定の誤りにすぐ気づけます。

## まとめ

`removeCache` は、PHP のクラスを作り直せない制約を、新しい名前への差し替えで乗り越える関数です。読み込み済みの記録を整理し、キャッシュに実体の削除を依頼します。ランタイムの制約を、設計で回避している点が、この短い関数の読みどころです。
