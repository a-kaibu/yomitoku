---
title: "パスを、同じ書き方に整えて返す"
description: "Symfony の Path::canonicalize は、~ やパスの区切りの揺れを整えて、同じ場所を指す文字列を 1 つの形にそろえます。結果は一時保存して再利用します。"
language: php
project: Symfony
repo: https://github.com/symfony/symfony
license: MIT
copyright: Copyright (c) 2004-present Fabien Potencier
commit: "7c22be9fc7d3ea202cd09573edf6658cf427fcad"
file: src/Symfony/Component/Filesystem/Path.php
lines: [64, 99]
function: Path::canonicalize
difficulty: 2
format: 2
tags: [文字列処理, キャッシュ]
---

## ひとことで

`~/docs/../src/a.php` と `/home/me/src/a.php` は、同じファイルを指します。この関数は、そのように書き方が違う同じパスを、1 つの決まった形にそろえて返します。

## コード

::: code-group

```php:line-numbers=64 [日本語訳]
    public static function canonicalize(string $path): string
    {
        if ('' === $path) {
            return '';
        }

        // このメソッドは、このクラスの多くの他のメソッドから呼ばれる。結果を
        // バッファ（一時的な保存場所）に入れておき、
        // 大きな性能の低下を補う。
        if (isset(self::$buffer[$path])) {
            return self::$buffer[$path];
        }

        // 「~」を、ユーザーのホームディレクトリに置き換える。
        if ('~' === $path[0]) {
            $path = self::getHomeDirectory().substr($path, 1);
        }

        $path = self::normalize($path);

        [$root, $pathWithoutRoot] = self::split($path);

        $canonicalParts = self::findCanonicalParts($root, $pathWithoutRoot);

        // ルートのディレクトリを、もう一度付け加える。
        self::$buffer[$path] = $canonicalPath = $root.implode('/', $canonicalParts);
        ++self::$bufferSize;

        // メモリのリークを防ぐため、定期的に整理する。
        if (self::$bufferSize > self::CLEANUP_THRESHOLD) {
            self::$buffer = \array_slice(self::$buffer, -self::CLEANUP_SIZE, null, true);
            self::$bufferSize = self::CLEANUP_SIZE;
        }

        return $canonicalPath;
    }
```

```php:line-numbers=64 [原文]
    public static function canonicalize(string $path): string
    {
        if ('' === $path) {
            return '';
        }

        // This method is called by many other methods in this class. Buffer
        // the canonicalized paths to make up for the severe performance
        // decrease.
        if (isset(self::$buffer[$path])) {
            return self::$buffer[$path];
        }

        // Replace "~" with user's home directory.
        if ('~' === $path[0]) {
            $path = self::getHomeDirectory().substr($path, 1);
        }

        $path = self::normalize($path);

        [$root, $pathWithoutRoot] = self::split($path);

        $canonicalParts = self::findCanonicalParts($root, $pathWithoutRoot);

        // Add the root directory again
        self::$buffer[$path] = $canonicalPath = $root.implode('/', $canonicalParts);
        ++self::$bufferSize;

        // Clean up regularly to prevent memory leaks
        if (self::$bufferSize > self::CLEANUP_THRESHOLD) {
            self::$buffer = \array_slice(self::$buffer, -self::CLEANUP_SIZE, null, true);
            self::$bufferSize = self::CLEANUP_SIZE;
        }

        return $canonicalPath;
    }
```

:::

## 前提知識

- **パス**: ファイルやフォルダの場所を表す文字列です。`/` で区切られた名前が並びます。
- **ホームディレクトリ**: ユーザーごとの作業場所です。Linux や macOS では `~` と書くと、その場所を指します。
- **正規化**: 同じ意味の書き方を 1 つの形にそろえることです。
- **静的メソッド**: `クラス名::メソッド名()` の形で、オブジェクトを作らずに呼べる関数です。
- **バッファ（キャッシュ）**: 一度計算した結果を保存しておき、次から使い回す仕組みです。

## 何をしているか

### 1. 空のパスなら、そのまま空を返す

```php:line-numbers=66
        if ('' === $path) {
            return '';
        }
```

空の文字列は、整える対象がないので、すぐに返します。

### 2. 前に計算した結果があれば、それを返す

```php:line-numbers=73
        if (isset(self::$buffer[$path])) {
            return self::$buffer[$path];
        }
```

同じパスを何度も渡されることが多いので、一度計算した結果を `self::$buffer` から返します。

### 3. 先頭の `~` を、ホームディレクトリに置き換える

```php:line-numbers=78
        if ('~' === $path[0]) {
            $path = self::getHomeDirectory().substr($path, 1);
        }
```

先頭が `~` なら、ホームディレクトリの場所に置き換えます。

### 4. 正規化して、ルートと残りに分け、正しい形の部品を作る

```php:line-numbers=82
        $path = self::normalize($path);

        [$root, $pathWithoutRoot] = self::split($path);

        $canonicalParts = self::findCanonicalParts($root, $pathWithoutRoot);
```

`normalize` で区切りの揺れをそろえ、`split` でルート（`/` など）と残りに分けます。残りは `findCanonicalParts` で部品にします。

### 5. 結果をバッファに入れ、ルートを付けて返す

```php:line-numbers=89
        self::$buffer[$path] = $canonicalPath = $root.implode('/', $canonicalParts);
        ++self::$bufferSize;
```

整えた部品をルートにつなぎ、次の呼び出しのためにバッファへ保存します。

## ここがすごい

### 同じ計算を省く「バッファ」

```php:line-numbers=73
        if (isset(self::$buffer[$path])) {
            return self::$buffer[$path];
        }
```

Symfony の中では、同じパスを何度も整えることが多くあります。一度の計算結果を保存して返すことで、全体の処理を速くしています。

### 溜まりすぎたら、古いものだけ捨てる

```php:line-numbers=93
        if (self::$bufferSize > self::CLEANUP_THRESHOLD) {
            self::$buffer = \array_slice(self::$buffer, -self::CLEANUP_SIZE, null, true);
            self::$bufferSize = self::CLEANUP_SIZE;
        }
```

`array_slice` の `-self::CLEANUP_SIZE` で、後ろから一定数だけを残します。保存を無制限に増やさず、メモリの使いすぎを防いでいます。

## まとめ

この関数は、パスの書き方を 1 つの形にそろえる入り口です。`~` の展開、区切りの正規化、ルートの分離、結果のバッファを、短い流れで組み合わせています。
