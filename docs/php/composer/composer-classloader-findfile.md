---
title: "クラス名のファイルを、表・キャッシュ・探索の順で探す"
description: "Composer の ClassLoader::findFile は、クラス名からファイルのパスを求めます。クラスマップ、APCu のキャッシュ、存在しなかったことの記録を組み合わせて、探索の回数を減らしています。"
language: php
project: Composer
repo: https://github.com/composer/composer
license: MIT
copyright: Copyright (c) Nils Adermann, Jordi Boggiano
commit: "ae54d59bec96633ae442a009f3793b0b450351cd"
file: src/Composer/Autoload/ClassLoader.php
lines: [442, 475]
function: ClassLoader::findFile
difficulty: 3
format: 2
tags: [キャッシュ, ハッシュ, 標準ライブラリ, 最適化]
---

## ひとことで

`findFile` は、クラス名から **そのクラスを書いたファイルのパス** を探す関数です。毎回フォルダをたどるのではなく、事前に作った表（クラスマップ）、共有キャッシュ（APCu）、「存在しないクラス」の記録の順に確かめて、探索を最小限にしています。

## コード

::: code-group

```php:line-numbers=442 [日本語訳]
    public function findFile($class)
    {
        // クラスマップを先に確かめる。
        if (isset($this->classMap[$class])) {
            return $this->classMap[$class];
        }
        if ($this->classMapAuthoritative || isset($this->missingClasses[$class])) {
            return false;
        }
        if (null !== $this->apcuPrefix) {
            $file = apcu_fetch($this->apcuPrefix.$class, $hit);
            if ($hit) {
                return $file;
            }
        }

        $file = $this->findFileWithExtension($class, '.php');

        // HHVM で動いているときは Hack のファイルも探す。
        if (false === $file && defined('HHVM_VERSION')) {
            $file = $this->findFileWithExtension($class, '.hh');
        }

        if (null !== $this->apcuPrefix) {
            apcu_add($this->apcuPrefix.$class, $file);
        }

        if (false === $file) {
            // このクラスは存在しないと覚えておく。
            $this->missingClasses[$class] = true;
        }

        return $file;
    }
```

```php:line-numbers=442 [原文]
    public function findFile($class)
    {
        // class map lookup
        if (isset($this->classMap[$class])) {
            return $this->classMap[$class];
        }
        if ($this->classMapAuthoritative || isset($this->missingClasses[$class])) {
            return false;
        }
        if (null !== $this->apcuPrefix) {
            $file = apcu_fetch($this->apcuPrefix.$class, $hit);
            if ($hit) {
                return $file;
            }
        }

        $file = $this->findFileWithExtension($class, '.php');

        // Search for Hack files if we are running on HHVM
        if (false === $file && defined('HHVM_VERSION')) {
            $file = $this->findFileWithExtension($class, '.hh');
        }

        if (null !== $this->apcuPrefix) {
            apcu_add($this->apcuPrefix.$class, $file);
        }

        if (false === $file) {
            // Remember that this class does not exist.
            $this->missingClasses[$class] = true;
        }

        return $file;
    }
```

:::

## 前提知識

- **クラスマップ**: 「クラス名 → ファイルのパス」の連想配列です。Composer が `composer install` のときに作ります。
- **`isset`**: 変数や配列の要素があり、かつ `null` ではないかを調べる書き方です。
- **APCu**: PHP のプロセス内で共有できるキャッシュの仕組みです。`apcu_fetch` で取り出し、`apcu_add` で保存します。
- **`defined('HHVM_VERSION')`**: HHVM という別の PHP 実行環境で動いているかを調べる定数の確認です。
- **`$hit`**: `apcu_fetch` に渡すと、キャッシュにあったかどうかを表す変数に入る書き方です。

## 何をしているか

### 1. まずクラスマップを見る

::: code-group

```php:line-numbers=444 [日本語訳]
        // クラスマップを先に確かめる。
        if (isset($this->classMap[$class])) {
            return $this->classMap[$class];
        }
```

```php:line-numbers=444 [原文]
        // class map lookup
        if (isset($this->classMap[$class])) {
            return $this->classMap[$class];
        }
```

:::

「クラス名 → パス」の表を先に確かめます。ここに入っていれば、ファイルを探さずにパスを返します。表にないなら、ローダーが **このクラスは存在しない** と判断できる条件を確かめます。

### 2. 探さない条件を先に確かめる

```php:line-numbers=448
        if ($this->classMapAuthoritative || isset($this->missingClasses[$class])) {
            return false;
        }
```

`$this->classMapAuthoritative` が `true` なら、クラスマップが完全な表だという意味です。表にないクラスはファイルが存在しないので、`false` を返します。また `missingClasses` に入っているクラスは、前に探して見つからなかったものです。同じ探索を繰り返さないように、`false` を返します。

### 3. APCu のキャッシュを使う

```php:line-numbers=451
        if (null !== $this->apcuPrefix) {
            $file = apcu_fetch($this->apcuPrefix.$class, $hit);
            if ($hit) {
                return $file;
            }
        }
```

APCu が使える設定（`apcuPrefix` がある）のときは、キャッシュを見ます。`apcu_fetch($prefix.$class, $hit)` の `$hit` が `true` なら、キャッシュにあったパスを返します。

### 4. 最後にファイルを探して、結果を覚える

::: code-group

```php:line-numbers=458 [日本語訳]
        $file = $this->findFileWithExtension($class, '.php');

        // HHVM で動いているときは Hack のファイルも探す。
        if (false === $file && defined('HHVM_VERSION')) {
            $file = $this->findFileWithExtension($class, '.hh');
        }

        if (null !== $this->apcuPrefix) {
            apcu_add($this->apcuPrefix.$class, $file);
        }

        if (false === $file) {
            // このクラスは存在しないと覚えておく。
            $this->missingClasses[$class] = true;
        }
```

```php:line-numbers=458 [原文]
        $file = $this->findFileWithExtension($class, '.php');

        // Search for Hack files if we are running on HHVM
        if (false === $file && defined('HHVM_VERSION')) {
            $file = $this->findFileWithExtension($class, '.hh');
        }

        if (null !== $this->apcuPrefix) {
            apcu_add($this->apcuPrefix.$class, $file);
        }

        if (false === $file) {
            // Remember that this class does not exist.
            $this->missingClasses[$class] = true;
        }
```

:::

ここまでで決まらなければ、`.php` の拡張子でファイルを探します。HHVM のときは `.hh` も探します。探した結果は APCu に保存します。見つからなければ、`missingClasses` にそのクラス名を記録しておきます。

```php:line-numbers=474
        return $file;
```

最後に、結果（パスか `false`）を返します。

## ここがすごい

### 「ないもの」を覚えておく

存在しないクラスは、いつまでも探し続けると大きな無駄になります。たとえば `class_exists` の確認で、同じ名前が何度も調べられることがあります。Composer は `missingClasses` に「見つからなかった」ことを記録し、次は探さずに `false` を返します。「ある」だけでなく「ない」も覚えるのが、この関数の大きな工夫です。

### 表、キャッシュ、探索の順で、コストの低い方から試す

探索は、表を引くのが一番速く、ファイルの存在を確かめるのが一番遅いです。そこで、クラスマップ、APCu、ファイル探索の順に確かめます。最も安い方法で答えが出れば、高い方法は使いません。

### 比較した書き方との違い

素直に「`.php` があるか、なければ `.hh` を探す」だけなら、数行で書けます。しかしこの関数は、オートロードが何百回も呼ばれるリクエストで、同じ探索を繰り返さないことを優先しています。コードの長さより、呼び出し回数の少なさを選んだ設計です。

## まとめ

- 探索は、安い方法（表・キャッシュ）から順に試すと速くなる。
- 「存在しない」という結果も記録しておくと、同じ探索を繰り返さない。
- キャッシュは「あった」だけでなく「なかった」も保存すると効果が大きい。
- 同じ問い合わせが何度も来る処理は、戻り値を覚えるだけで大きく速くなる。
